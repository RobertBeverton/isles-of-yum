---
name: audio-narration-prep
description: Use when a finished, approved Isles of Yum story needs to be prepared for narration via ElevenLabs (or similar multi-voice text-to-speech). Converts finished story markdown into the batched narrator/character turn format required by the audio pipeline. Do not use on unfinished drafts — stories should be fully written and reviewed first.
---

# Audio Narration Prep

Prepares a finished story for the ElevenLabs multi-voice narration pipeline.
This is a mechanical conversion step, not a creative one — the story should
already be finished, reviewed, and finalized in `docs/Story_Archive.md`
before this skill runs.

Full technical spec (API constraints, batching rules, voice-mapping format)
lives in `audio-pipeline/SPEC.md` in the repo root — read that before doing
this conversion, it has the authoritative detail on the 2,000-character
batch limit, voice_id mapping, and the suggested parsing approach.

## Filename convention (must match, always)

The site finds a story's audio by filename alone: `stories/some-story.md`
plays `stories/some-story.mp3`, colocated in the same folder, no front matter
required. When this skill or the pipeline script produces the final MP3, name
it and place it to match the story's own filename exactly — same basename,
same folder. Never invent a different name (no title-cased, spaced, or
punctuated version of the title) — that breaks the auto-detection and leaves
the story showing no audio player. If the audio genuinely can't share the
story's filename, use an explicit `audio: "other-name.mp3"` front-matter field
instead, but that should be the rare exception, not the default.

## What this skill does

1. Confirms the target story file exists in `stories/` and is the finished
   version (check `docs/Story_Archive.md` has an entry for it).
2. Reads `audio-pipeline/voice_map.json` (or flags that it doesn't exist yet
   and needs to be created — see SPEC.md for the format) to get the
   character → voice_id mapping.
3. Parses the story into narration vs. dialogue turns, following the
   approach in SPEC.md. Flags any low-confidence dialogue attribution for
   manual review rather than silently guessing.
4. Before finalizing, run a quick check against `persona-review`'s
   🎧 narration-format persona notes for this story, if that review was
   done during writing — any beats flagged there as relying on vocal
   performance should get extra attention in how they're split into turns.
5. Batches turns to stay under the character limit per SPEC.md, preferring
   to break at scene boundaries (`• • •` markers).
6. Outputs the batched turn list in the format the pipeline script expects
   (see SPEC.md's suggested CLI/data shape).

## What this skill does not do

Does not call the ElevenLabs API itself or produce audio — that's the job
of the actual pipeline code described in SPEC.md. This skill produces the
input that code consumes. If that pipeline code doesn't exist yet in the
repo, say so clearly rather than assuming it's there.
