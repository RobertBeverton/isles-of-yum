import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SCENE_BREAK = /\n\s*•\s*•\s*•\s*\n/g;
const DIALOGUE_TAG = /\b(?:said|asked|whispered|shouted|replied|cut in|added)\s+([A-Z][a-zA-Z]*)|\b([A-Z][a-zA-Z]*)\s+(?:said|asked|whispered|shouted|replied)\b/;
// Title abbreviations that end in a period but never end a sentence, e.g.
// "said Mr. Smith". Used as a negative lookbehind so the sentence splitter
// doesn't treat that period as a sentence boundary.
const TITLE_ABBREVIATIONS = ["Mr", "Mrs", "Ms", "Dr", "St", "Jr", "Sr"];
const ABBREV_LOOKBEHIND = TITLE_ABBREVIATIONS.join("|");
// Same shape as the original /[^.!?]+[.!?]+(\s|$)/g, except a run of
// terminators is only accepted once it contains at least one terminator
// that is NOT a period directly after a title abbreviation (e.g. "Mr.").
const SENTENCE_SPLIT = new RegExp(
  `[^.!?]+(?:[!?]|(?<!\\b(?:${ABBREV_LOOKBEHIND}))\\.)+(\\s|$)`,
  "g"
);
// Real API ceiling is 2000 chars (see SPEC.md); 1800 leaves safety headroom.
const MAX_BATCH_CHARS = 1800;

export function parseScenes(markdown) {
  return markdown
    .split(SCENE_BREAK)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Splits one scene's text into narration/dialogue turns at the sentence
// level. A "turn" here is one sentence. A sentence containing a quoted span
// is a dialogue turn, attributed via the nearest dialogue tag in that same
// sentence; a sentence with a quote but no resolvable tag is flagged
// low-confidence rather than guessed.
export function splitIntoTurns(text) {
  const sentences = text.match(SENTENCE_SPLIT) ?? [text];
  return sentences.map((raw) => {
    const sentence = raw.trim();
    if (!sentence) return null;
    const hasQuote = /"[^"]+"/.test(sentence);
    if (!hasQuote) {
      return { speaker: "NARRATOR", text: sentence, confident: true };
    }
    // The dialogue tag ("said Felix", "Felix said") always appears in the
    // narration text surrounding a quote, never inside it — so search for
    // the tag only in what's left after the quoted span(s) are removed.
    // Otherwise a capitalized word inside the quote itself (e.g. "I" in
    // `"I said no," Felix said.`) can be mistaken for the speaker's name.
    const outsideQuotes = sentence.replace(/"[^"]*"/g, " ");
    const match = outsideQuotes.match(DIALOGUE_TAG);
    const name = match ? (match[1] || match[2]) : null;
    if (!name) {
      return { speaker: null, text: sentence, confident: false };
    }
    return { speaker: name.toUpperCase(), text: sentence, confident: true };
  }).filter(Boolean);
}

// Adds line numbers (best-effort, based on position in the original scene
// text) and checks each turn against the voice map. Any turn that was
// low-confidence at parse time, OR whose resolved speaker has no entry in
// voiceMap, is returned for the caller to report and abort on.
export function flagLowConfidence(turns, voiceMap = null) {
  return turns
    .map((t, i) => ({ ...t, line: t.line ?? i + 1 }))
    .filter((t) => !t.confident || (voiceMap && t.speaker && !(t.speaker in voiceMap)));
}

export function mergeAdjacentTurns(turns) {
  const merged = [];
  for (const turn of turns) {
    const last = merged[merged.length - 1];
    if (last && last.speaker === turn.speaker) {
      last.text = `${last.text} ${turn.text}`;
    } else {
      merged.push({ speaker: turn.speaker, text: turn.text });
    }
  }
  return merged;
}

// Greedily packs turns into batches whose summed text length stays under
// maxChars, never splitting a single turn across two batches.
export function packBatches(turns, maxChars = MAX_BATCH_CHARS) {
  const batches = [];
  let current = [];
  let currentLen = 0;
  for (const turn of turns) {
    const len = turn.text.length;
    if (current.length > 0 && currentLen + len > maxChars) {
      batches.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(turn);
    currentLen += len;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

async function callElevenLabs(batch, voiceMap, apiKey, cacheDir) {
  const inputs = batch.map((t) => ({ text: t.text, voice_id: voiceMap[t.speaker] }));
  const key = crypto.createHash("sha256").update(JSON.stringify(inputs)).digest("hex");
  const cachePath = path.join(cacheDir, `${key}.mp3`);
  if (fs.existsSync(cachePath)) return cachePath;

  const res = await fetch("https://api.elevenlabs.io/v1/text-to-dialogue", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs request failed (${res.status}): ${await res.text()}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(cacheDir, { recursive: true });
  // Write to a temp path and rename into place, so a process kill mid-write
  // never leaves a corrupt file at cachePath that a later run would treat
  // as a valid cache hit (rename is atomic on the same filesystem).
  const tempPath = `${cachePath}.tmp`;
  fs.writeFileSync(tempPath, buffer);
  fs.renameSync(tempPath, cachePath);
  return cachePath;
}

function concatWithFfmpeg(mp3Paths, outPath) {
  const listPath = path.join(path.dirname(outPath), `.concat-list-${Date.now()}.txt`);
  const listContent = mp3Paths.map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listPath, listContent);
  try {
    execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath]);
  } catch (err) {
    throw new Error(`ffmpeg failed (is it installed and on PATH?): ${err.message}`);
  } finally {
    fs.unlinkSync(listPath);
  }
}

// Returns the value following `flag` in `args`, or `defaultValue` when the
// flag is absent or has nothing after it. Using indexOf + 1 directly (as
// the original code did) silently returns the wrong argument when the flag
// isn't found, because indexOf returns -1 and args[-1 + 1] === args[0].
export function getArgValue(args, flag, defaultValue) {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return defaultValue;
  return args[i + 1];
}

async function main() {
  const [, , storyPath, ...rest] = process.argv;
  if (!storyPath) {
    console.error("Usage: node audio-pipeline/narrate.mjs <story.md> --voice-map <voice_map.json> --out <out.mp3>");
    process.exit(1);
  }
  const voiceMapPath = getArgValue(rest, "--voice-map", "audio-pipeline/voice_map.json");
  const outPath = getArgValue(rest, "--out", undefined);
  if (!outPath) {
    console.error("Missing --out <path.mp3>");
    process.exit(1);
  }

  let voiceMap;
  try {
    voiceMap = JSON.parse(fs.readFileSync(voiceMapPath, "utf8"));
  } catch (err) {
    console.error(`Failed to read voice map at ${voiceMapPath}: ${err.message}`);
    process.exit(1);
  }

  let markdown;
  try {
    markdown = fs.readFileSync(storyPath, "utf8").replace(/^---[\s\S]*?---\n/, "");
  } catch (err) {
    console.error(`Story file not found: ${storyPath}`);
    process.exit(1);
  }

  const scenes = parseScenes(markdown);
  const allTurns = scenes.flatMap((scene) => splitIntoTurns(scene));

  const flagged = flagLowConfidence(allTurns, voiceMap);
  if (flagged.length > 0) {
    console.error(`✖ ${flagged.length} low-confidence attribution(s) found:`);
    for (const t of flagged) {
      console.error(`  line ${t.line}: "${t.text.slice(0, 60)}..." (speaker: ${t.speaker ?? "unresolved"})`);
    }
    console.error("Fix these in the source file and rerun. No audio generated.");
    process.exit(1);
  }

  const merged = mergeAdjacentTurns(allTurns);
  const batches = packBatches(merged, MAX_BATCH_CHARS);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("Missing ELEVENLABS_API_KEY environment variable.");
    process.exit(1);
  }

  const cacheDir = path.join(path.dirname(outPath), ".narrate-cache");
  const batchPaths = [];
  try {
    for (const [i, batch] of batches.entries()) {
      console.log(`Generating batch ${i + 1}/${batches.length}...`);
      batchPaths.push(await callElevenLabs(batch, voiceMap, apiKey, cacheDir));
    }
  } catch (err) {
    console.error(`Failed to generate audio via ElevenLabs: ${err.message}`);
    process.exit(1);
  }

  try {
    concatWithFfmpeg(batchPaths, outPath);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const { parseFile } = await import("music-metadata");
  const metadata = await parseFile(outPath);
  console.log(`Done: ${outPath} (${Math.round(metadata.format.duration ?? 0)}s)`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
