# Isles of Yum

**Read the stories: https://robertbeverton.github.io/isles-of-yum/**

A story world and writing project for Felix and Alex: stories set in a magical, food-themed archipelago. A warm, glowing jigsaw piece pulls the boys through to the Isles, a sea of islands each built around a food a five-year-old would love, and always pulls them home again.

This repo holds the stories and the world and writing guides behind them. The app that publishes them, the audio hosting and the narrator live in the [Stories repo](https://github.com/RobertBeverton/Stories).

## What's in here

| Path | What it is |
|---|---|
| `stories/` | The stories, as Markdown with front matter. Narrated stories carry `audioUrl`, `audioDuration` and `parts` in their front matter; the audio itself is hosted on Cloudflare R2. |
| `docs/World_Guide.md` | The master reference: world premise, islands, characters, craft rules, the long-form story blueprint, and the writing process. |
| `docs/Story_Archive.md` | Every story written, with notes on what worked and what to watch for next time. |
| `docs/Ideas_and_Arcs_Tracker.md` | Story seeds not yet used. |
| `docs/process/README.md` | Index for starting or continuing story work. |
| `reference/` | Two long-form stories from a different project, kept as craft references only (chapter structure, refrain, handover). Not part of this world's canon. |
| `narration/` | This world's narration settings: `pronunciations.json` (respellings for names the voice mangles). |
| `.claude/skills/` | Claude Code skills for the writing process: story outline-to-draft, world consistency check, naming, character voice, persona review, narration prep. |

## How this fits

Stories live here. The app, hosting and narrator live in the [Stories repo](https://github.com/RobertBeverton/Stories) (checked out beside this one as `../Stories`), which pulls stories from this repo at build time. Pushes and pull requests here run `.github/workflows/validate.yml`, which checks the stories against the app's contract. To check locally, from this repo's root:

```bash
node ../Stories/scripts/validate-world-data.mjs --strict --world isles-of-yum
```

Never rename, move or delete a story file: its path is the slug that keys listeners' saved progress.

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
4. Run the validate command above.
5. Update `docs/Story_Archive.md`, and `docs/World_Guide.md` if you added islands or characters.

Standard stories run about 15–20 minutes narrated. Long-form stories run about 4,200–5,000 words (about 30 minutes) in roughly 16 short chapters, with their own blueprint in the World Guide.

## Narration

From the Stories checkout, with `ELEVENLABS_API_KEY` set and `ffmpeg` on your PATH (local only, never CI):

```bash
npm run narrate -- ../isles-of-yum/stories/some-story.md --dry-run   # read what the voice will say
npm run narrate -- ../isles-of-yum/stories/some-story.md
npm run upload-audio -- --apply --world isles-of-yum --story some-story
```

Then commit the story's changed front matter (`audioUrl`, `audioDuration`, `parts`) here. No mp3 is ever committed. See `../Stories/narrator/README.md`.

## The Isles so far

- *The Isles of Yum*
- *The Map-Maker's Map* and *The Great Kitchen* (Nib's Map)
- *Marzipan's Well*
- *Toffee Apple Orchard*
- *The Sweet Chain* (three parts)
- *The Biggest Gingerbread Man in the Isles* (the first long-form story)

## A note on canon

This world's canon is deliberately separate from the other worlds the Stories app hosts (Felix and Alex's Bramble Wall and Trio Force world, and others). They have different canon and different processes, and are kept apart so neither contaminates the other.
