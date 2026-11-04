---
name: audio-narration-prep
description: Use when a finished, approved Isles of Yum story is about to be narrated. A pre-flight checklist before running the Stories repo's narrator: confirm the story is done, check its scene breaks and headings, add respellings for names the voice may mangle, dry-run, narrate, upload and commit. Do not use on unfinished drafts.
---

# Audio Narration Prep

A pre-flight checklist for narrating a finished story. The story must already
be finished and reviewed. The narrator itself lives in the Stories repo
(`../Stories/narrator/README.md`); this repo only holds the story and its
narration settings.

## Checklist

1. **Finished?** Confirm the story is finished, has passed `persona-review`,
   and has its entry in `docs/Story_Archive.md`.
2. **Format.** The story uses `• • •` scene breaks, with `## Part N. Title`
   headings only where wanted. A heading is read aloud as a spoken line and
   gives the app its part list.
3. **Respellings.** Add any names the voice might mangle to
   `narration/pronunciations.json` as `"Written": "Spoken"`, one line each
   (whole words, case-sensitive). Names to listen for so far: Marzipan,
   Mizzel, Crispin, Nib. Add them after first hearing a narrated story, not
   before.
4. **Dry run.** From a Stories checkout:
   `npm run narrate -- ../isles-of-yum/stories/<story>.md --dry-run`
   Read the output: it is exactly what the voice will say. No key, no cost.
5. **Narrate, then host.** Run the same command without `--dry-run` (needs
   `ELEVENLABS_API_KEY` and ffmpeg; spends credits; never in CI), then
   `npm run upload-audio -- --apply --world isles-of-yum --story <story>`.
6. **Commit** the story's changed front matter here (`audioUrl`,
   `audioDuration`, `parts`). Never commit an mp3.

## One voice per world

There is one voice per world for now. Multi-voice narration was never set up:
the old `voice_map.json` held only placeholder IDs. If it is ever wanted, it
gets added centrally in the Stories repo's narrator, not here.

## Filenames

A story's path is its slug for listeners' saved progress. Never rename, move or
delete a story file.
