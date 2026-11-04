# Isles of Yum

A story world and writing project for Felix & Alex — bedtime stories set in a
magical food-themed archipelago.

**Read first, always:** `docs/World_Guide.md` — world premise, established
islands, characters, craft rules, and the writing process. Written so a new
session can pick up the whole project cold. Then `docs/Story_Archive.md` for
what's been written and what worked.

**Writing a new story:** use the `story-writing-process` skill under
`.claude/skills/` — it orchestrates the full outline-to-final-draft pipeline
and calls in the supporting skills (`world-consistency-check`,
`naming-workshop`, `character-voice-guide`, `persona-review`,
`audio-narration-prep`) at the right points.

**How this fits.** This repo is the content for the Isles of Yum world: stories,
lore and canon, the writing docs, and `narration/` (this world's narration
settings). The app, hosting and narrator live in the `RobertBeverton/Stories`
repo (checked out beside this one as `../Stories`), which pulls stories from
here at build time. Do not add site code, narration code, build config or mp3s
here.

- **Check content:** from this repo's root,
  `node ../Stories/scripts/validate-world-data.mjs --strict --world isles-of-yum`
  (also what CI runs).
- **Narrate a story:** from the Stories checkout,
  `npm run narrate -- ../isles-of-yum/stories/<story>.md`, then
  `npm run upload-audio`. Needs `ELEVENLABS_API_KEY`; never runs in CI. Commit the
  story's changed front matter (`audioUrl`, `audioDuration`, `parts`) here.
  See `../Stories/narrator/README.md`.
- **Narration settings:** `narration/pronunciations.json` (`{ "Written": "Spoken" }`
  for names the voice mangles) and optionally `narration/narrator.json`
  (`voiceId`, `modelId`).
- **Story paths are load-bearing.** A story's file path is its slug, which keys
  listeners' saved progress. Never rename, move or delete a story file.

Audio is hosted on Cloudflare R2 and referenced from each story's front matter
(`audioUrl`, `audioDuration`, `parts`). Narrated stories carry no mp3 in git; a
story not yet narrated simply has no `audioUrl`.

This world's canon is intentionally separate from the other worlds the Stories
app hosts (Felix & Alex's Bramble Wall / Trio Force and others): different
canon, different process, kept apart so neither pollutes the other's context.
