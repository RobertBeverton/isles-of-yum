# Audio Pipeline Spec — Isles of Yum narration

## Goal
Turn a finished story (`stories/*.md`) into a single narrated MP3 using ElevenLabs
multi-voice Text to Dialogue, with a consistent voice per recurring character across
every story.

## Why this needs a pipeline, not a single API call
ElevenLabs' Text to Dialogue endpoint (`POST /v1/text-to-dialogue`) takes a list of
`{text, voice_id}` turns and stitches them into one audio response — this is the
"multi-voice, minimal effort" option, not the plain single-voice Text to Speech
endpoint. It has two hard constraints that make a full ~2,500–3,000 word story
impossible to send in one request:

- **2,000 character limit per request**, summed across all `inputs[].text` fields.
  Longer requests can silently truncate or return a validation error.
- **Max 10 unique voice_ids per request** (not a practical limit for this project,
  since each story only uses a handful of characters).

So a full story must be:
1. Parsed into an ordered list of turns (narration + character dialogue)
2. Batched into groups that stay under ~2,000 characters per batch, breaking only
   at clean sentence/scene boundaries (never mid-sentence)
3. Sent to the API one batch at a time
4. The resulting audio clips concatenated in order into one final MP3

## Input format
Story files are plain Markdown, following the established house style:
- Scene breaks marked with a line containing only `• • •`
- Dialogue in standard quotation marks, e.g. `"Alex," said Felix, "the water's gone weird."`
- Narration is everything else

## Voice mapping (set once, reused across all stories)
A config file (`voice_map.json`) maps character name → ElevenLabs voice_id:

```json
{
  "NARRATOR": "voice_id_here",
  "FELIX": "voice_id_here",
  "ALEX": "voice_id_here",
  "MARZIPAN": "voice_id_here"
}
```

New recurring characters (Nib, Crispin, Mizzle, etc.) get added here the first time
they appear in a story that gets narrated. One-off/minor speaking residents can
either share a generic "RESIDENT" voice or be folded into NARRATOR — decide per
story, not worth a unique voice for a single line.

## Parsing approach
1. Split the story on `• • •` into scenes (natural batch-break candidates).
2. Within each scene, split into narration vs. dialogue turns. A reasonable
   heuristic: any sentence containing a quoted line becomes a dialogue turn
   attributed to whichever character's name appears nearest the quote (via the
   dialogue tag, e.g. "said Felix"); everything else is a NARRATOR turn.
3. This heuristic will need manual correction for tricky lines (e.g. two
   characters speaking in one paragraph, or dialogue tags that don't directly
   follow the quote) — build the parser to flag low-confidence attributions for
   a quick manual review pass rather than silently guessing wrong.
4. Merge adjacent turns from the same voice to reduce total turn count.
5. Greedily pack turns into batches ≤ ~1,800 characters (leaving headroom under
   the 2,000 limit), never splitting a single turn across two batches, and
   preferring to start a new batch at a scene break when one falls near the limit.

## Output
- One MP3 per batch from the API, saved in order.
- Concatenate all batches into a single final MP3 per story (e.g. via `ffmpeg`
  concat) — final filename matches the story, e.g. `08_Marzipans_Well.mp3`.

## Suggested CLI shape
```
python narrate.py stories/08_Marzipans_Well.md --voice-map voice_map.json --out audio/08_Marzipans_Well.mp3
```

## Open decisions for whoever builds this in Claude Code
- Confirm ElevenLabs plan/tier supports the character volume needed (check
  current pricing/limits on elevenlabs.io — this spec was written from
  documentation current as of August 2026 and should be re-checked).
- Decide whether low-confidence dialogue attributions block the run (safer) or
  just get logged as warnings (faster iteration).
- Decide on a minor-character voice strategy (shared generic voice vs. folding
  into narrator) and record the decision here once made.
