import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SCENE_BREAK = /\n\s*•\s*•\s*•\s*\n/g;
// eleven_multilingual_v2's real ceiling is 10,000 chars/request; keep
// headroom so a chunk boundary never lands exactly on the limit.
const MAX_CHUNK_CHARS = 9000;
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const DEFAULT_VOICE_ID = "ZF6FPAbjXT4488VcRRnw"; // Amelia

export function parseScenes(markdown) {
  return markdown
    .split(SCENE_BREAK)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Packs whole scenes into chunks under maxChars, so a chunk boundary always
// falls on a scene break when possible. A single scene longer than maxChars
// (rare) is split on sentence boundaries instead, never mid-sentence.
export function packChunks(scenes, maxChars = MAX_CHUNK_CHARS) {
  const chunks = [];
  let current = "";
  for (const scene of scenes) {
    const piece = current ? `${current}\n\n${scene}` : scene;
    if (piece.length <= maxChars) {
      current = piece;
      continue;
    }
    if (current) chunks.push(current);
    if (scene.length <= maxChars) {
      current = scene;
      continue;
    }
    const sentences = scene.match(/[^.!?]+(?:[.!?]+(\s|$))?/g) ?? [scene];
    current = "";
    for (const sentence of sentences) {
      const withSentence = current ? `${current}${sentence}` : sentence;
      if (withSentence.length > maxChars && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current = withSentence;
      }
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function callElevenLabs({ text, voiceId, modelId, apiKey, cacheDir, previousRequestId }) {
  const key = crypto.createHash("sha256")
    .update(JSON.stringify({ text, voiceId, modelId, previousRequestId }))
    .digest("hex");
  const cachePath = path.join(cacheDir, `${key}.mp3`);
  const idPath = path.join(cacheDir, `${key}.request-id`);
  if (fs.existsSync(cachePath) && fs.existsSync(idPath)) {
    console.log("  -> cached, skipping API call");
    return { mp3Path: cachePath, requestId: fs.readFileSync(idPath, "utf8").trim() };
  }

  const body = {
    text,
    model_id: modelId,
  };
  if (previousRequestId) {
    body.previous_request_ids = [previousRequestId];
  }

  console.log("  -> calling ElevenLabs (this can take a while for a long chunk)...");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs request failed (${res.status}): ${await res.text()}`);
  }
  const requestId = res.headers.get("request-id") ?? res.headers.get("x-request-id") ?? "";
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(cacheDir, { recursive: true });
  const tempPath = `${cachePath}.tmp`;
  fs.writeFileSync(tempPath, buffer);
  fs.renameSync(tempPath, cachePath);
  fs.writeFileSync(idPath, requestId);
  console.log(`  -> received ${(buffer.length / 1024).toFixed(0)} KB`);
  return { mp3Path: cachePath, requestId };
}

function concatWithFfmpeg(mp3Paths, outPath) {
  if (mp3Paths.length === 1) {
    fs.copyFileSync(mp3Paths[0], outPath);
    return;
  }
  const listPath = path.join(path.dirname(outPath), `.concat-list-${Date.now()}.txt`);
  const listContent = mp3Paths.map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listPath, listContent);
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath]);
  } catch (err) {
    throw new Error(`ffmpeg failed (is it installed and on PATH?): ${err.message}`);
  } finally {
    fs.unlinkSync(listPath);
  }
}

export function getArgValue(args, flag, defaultValue) {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return defaultValue;
  return args[i + 1];
}

async function main() {
  const [, , storyPath, ...rest] = process.argv;
  if (!storyPath) {
    console.error("Usage: node audio-pipeline/narrate-single-voice.mjs <story.md> [--voice-id <id>] [--model-id <id>] [--out <out.mp3>]");
    process.exit(1);
  }
  const voiceId = getArgValue(rest, "--voice-id", DEFAULT_VOICE_ID);
  const modelId = getArgValue(rest, "--model-id", DEFAULT_MODEL_ID);
  const defaultOutPath = storyPath.replace(/\.md$/, ".mp3");
  const outPath = getArgValue(rest, "--out", defaultOutPath);

  let markdown;
  try {
    markdown = fs.readFileSync(storyPath, "utf8").replace(/^---[\s\S]*?---\n/, "");
  } catch (err) {
    console.error(`Story file not found: ${storyPath}`);
    process.exit(1);
  }

  const scenes = parseScenes(markdown);
  const chunks = packChunks(scenes, MAX_CHUNK_CHARS);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("Missing ELEVENLABS_API_KEY environment variable.");
    process.exit(1);
  }

  const cacheDir = path.join(path.dirname(outPath), ".narrate-cache");
  const chunkPaths = [];
  let previousRequestId;
  try {
    for (const [i, chunk] of chunks.entries()) {
      console.log(`Generating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);
      const { mp3Path, requestId } = await callElevenLabs({
        text: chunk,
        voiceId,
        modelId,
        apiKey,
        cacheDir,
        previousRequestId,
      });
      chunkPaths.push(mp3Path);
      previousRequestId = requestId || previousRequestId;
    }
  } catch (err) {
    console.error(`Failed to generate audio via ElevenLabs: ${err.message}`);
    process.exit(1);
  }

  try {
    concatWithFfmpeg(chunkPaths, outPath);
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
