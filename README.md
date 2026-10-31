# Isles of Yum

**Read the stories: https://robertbeverton.github.io/isles-of-yum/**

A story world and writing project for Felix and Alex: bedtime (and anytime) stories set in a magical, food-themed archipelago. A warm, glowing jigsaw piece pulls the boys through to the Isles, a sea of islands each built around a food a five-year-old would love, and always pulls them home again.

This repo holds the stories, the world and writing guides behind them, the narration tooling, and the small static site that publishes it all.

## What's in here

| Path | What it is |
|---|---|
| `stories/` | The stories, as Markdown with front matter. A story's audio is the `.mp3` next to it with the same name (`some-story.md` plays `some-story.mp3`). |
| `docs/World_Guide.md` | The master reference: world premise, islands, characters, craft rules, the long-form story blueprint, and the writing process. |
| `docs/Story_Archive.md` | Every story written, with notes on what worked and what to watch for next time. |
| `docs/Ideas_and_Arcs_Tracker.md` | Story seeds not yet used. |
| `docs/process/README.md` | Index for starting or continuing story work. |
| `reference/` | Two long-form stories from a different project, kept as craft references only (chapter structure, refrain, handover). Not part of this world's canon. |
| `audio-pipeline/` | ElevenLabs narration scripts and the design in `SPEC.md`. |
| `.claude/skills/` | Claude Code skills for the writing process: story outline-to-draft, world consistency check, naming, character voice, persona review, narration prep. |
| `site/`, `eleventy.config.js`, `scripts/` | The 11ty site, build helpers, and content validation. |

## Using the site locally

```bash
npm install
npm run serve      # local dev server with live reload
npm run validate   # check story content (missing audio is a warning, not a failure)
npx vitest run     # run the test suite
npm run build      # validate, run contrast checks, build the site into _site/
```

Pushing to `main` builds and deploys to GitHub Pages through `.github/workflows/build.yml`. Pull requests run the build without deploying.

## Writing a new story

1. Read `docs/World_Guide.md` first, then `docs/Story_Archive.md`.
2. Use the `story-writing-process` skill. It runs the pipeline: outline, persona review, consistency check, draft, review, finalise.
3. Save the story to `stories/<kebab-name>.md` with this front matter:

   ```yaml
   ---
   title: "Story Title"
   description: "One sentence for the story card."
   tags: ["adventure", "islands"]
   islands: ["Biscuit Town"]
   keyIslands: ["Biscuit Town"]
   characters: ["Felix", "Alex"]
   publishDate: 2026-01-01
   draft: false
   ---
   ```

   Separate chapters or scenes with a line containing only `• • •`. Don't put chapter headings in the text, because the narration scripts split on `• • •` and would read a heading aloud.
4. Run `npm run validate` and `npx vitest run`.
5. Update `docs/Story_Archive.md`, and `docs/World_Guide.md` if you added islands or characters.

Standard stories run about 15–20 minutes narrated. Long-form stories run about 4,200–5,000 words (about 30 minutes) in roughly 16 short chapters, with their own blueprint in the World Guide.

## Narration

`audio-pipeline/narrate-single-voice.mjs` turns a finished story into one MP3 with a single ElevenLabs voice. It needs `ELEVENLABS_API_KEY` set and `ffmpeg` on your PATH, and it runs locally only, never in CI.

```bash
node audio-pipeline/narrate-single-voice.mjs stories/some-story.md
# optional: --voice-id <id> --model-id eleven_v4 --out <path.mp3>
```

The output defaults to the story's own filename next to the `.md`, which is how the site finds it. Never rename one side without renaming the other. `audio-pipeline/narrate.mjs` is the multi-voice version. It needs real voice IDs in `audio-pipeline/voice_map.json` (it ships with placeholders). See `audio-pipeline/SPEC.md` for both.

Front-matter audio options, only when needed: `audio: "other-name.mp3"` if the file can't share the story's name, or `audio: false` to silence the missing-audio warning for a story that will never be narrated. `audioDuration` is filled in by `npm run validate`.

## The Isles so far

- *The Isles of Yum*
- *The Map-Maker's Map* and *The Great Kitchen* (Nib's Map)
- *Marzipan's Well*
- *Toffee Apple Orchard*
- *The Sweet Chain* (three parts)
- *The Biggest Gingerbread Man in the Isles* (the first long-form story)

## A note on canon

This repo is deliberately separate from the Stories repo (Felix and Alex's Bramble Wall and Trio Force world). The two have different canon and different processes, and are kept apart so neither contaminates the other.
