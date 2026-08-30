import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SCENE_BREAK = /\n\s*•\s*•\s*•\s*\n/g;
const DIALOGUE_TAG = /\b(?:said|asked|whispered|shouted|replied|cut in|added)\s+([A-Z][a-zA-Z]*)|\b([A-Z][a-zA-Z]*)\s+(?:said|asked|whispered|shouted|replied)\b/;

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
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  return sentences.map((raw) => {
    const sentence = raw.trim();
    if (!sentence) return null;
    const hasQuote = /"[^"]+"/.test(sentence);
    if (!hasQuote) {
      return { speaker: "NARRATOR", text: sentence, confident: true };
    }
    const match = sentence.match(DIALOGUE_TAG);
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
export function packBatches(turns, maxChars = 1800) {
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
  fs.writeFileSync(cachePath, buffer);
  return cachePath;
}

function concatWithFfmpeg(mp3Paths, outPath) {
  const listPath = path.join(path.dirname(outPath), `.concat-list-${Date.now()}.txt`);
  const listContent = mp3Paths.map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listPath, listContent);
  try {
    execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath]);
  } finally {
    fs.unlinkSync(listPath);
  }
}

async function main() {
  const [, , storyPath, ...rest] = process.argv;
  if (!storyPath) {
    console.error("Usage: node audio-pipeline/narrate.mjs <story.md> --voice-map <voice_map.json> --out <out.mp3>");
    process.exit(1);
  }
  const voiceMapPath = rest[rest.indexOf("--voice-map") + 1] ?? "audio-pipeline/voice_map.json";
  const outPath = rest[rest.indexOf("--out") + 1];
  if (!outPath) {
    console.error("Missing --out <path.mp3>");
    process.exit(1);
  }

  const voiceMap = JSON.parse(fs.readFileSync(voiceMapPath, "utf8"));
  const markdown = fs.readFileSync(storyPath, "utf8").replace(/^---[\s\S]*?---\n/, "");

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
  const batches = packBatches(merged, 1800);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("Missing ELEVENLABS_API_KEY environment variable.");
    process.exit(1);
  }

  const cacheDir = path.join(path.dirname(outPath), ".narrate-cache");
  const batchPaths = [];
  for (const [i, batch] of batches.entries()) {
    console.log(`Generating batch ${i + 1}/${batches.length}...`);
    batchPaths.push(await callElevenLabs(batch, voiceMap, apiKey, cacheDir));
  }

  concatWithFfmpeg(batchPaths, outPath);

  const { parseFile } = await import("music-metadata");
  const metadata = await parseFile(outPath);
  console.log(`Done: ${outPath} (${Math.round(metadata.format.duration ?? 0)}s)`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
