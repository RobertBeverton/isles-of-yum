# Isles of Yum

A story world and writing project for Felix & Alex — bedtime stories set in a
magical food-themed archipelago. Static 11ty site, deployed to GitHub Pages.

**Read first, always:** `docs/World_Guide.md` — world premise, established
islands, characters, craft rules, and the writing process. Written so a new
session can pick up the whole project cold. Then `docs/Story_Archive.md` for
what's been written and what worked.

**Writing a new story:** use the `story-writing-process` skill under
`.claude/skills/` — it orchestrates the full outline-to-final-draft pipeline
and calls in the supporting skills (`world-consistency-check`,
`naming-workshop`, `character-voice-guide`, `persona-review`,
`audio-narration-prep`) at the right points.

**Local development:**
```bash
npm install
npm run serve      # local dev server with live reload
npm run validate   # check story content (missing audio is a warning, not a failure)
npx vitest run     # run the test suite
```

**Narration:** `audio-pipeline/narrate.mjs` turns a locked story into a
multi-voice MP3 via ElevenLabs. Requires `ELEVENLABS_API_KEY` env var and real
voice IDs in `audio-pipeline/voice_map.json` (ships with placeholders). Never
runs in CI — local only. See `audio-pipeline/SPEC.md` for the design.

**Story/audio filenames must match.** The site derives a story's audio file
from its own filename: `stories/some-story.md` plays `stories/some-story.mp3`,
colocated in the same folder — no front matter needed. If a story hasn't been
narrated yet, just don't add the mp3 (`npm run validate` will say so as a
warning, not a failure). Only add an explicit `audio: "other-name.mp3"` field
when the audio genuinely can't share the story's filename; add `audio: false`
to silence the warning for a story that will never get narration. Never rename
one side (the `.md` or the `.mp3`) without renaming the other to match.

This repo is intentionally separate from the `Stories` repo (Felix & Alex's
Bramble Wall / Trio Force shared-canon world) — different canon, different
process, kept apart so neither pollutes the other's context.
