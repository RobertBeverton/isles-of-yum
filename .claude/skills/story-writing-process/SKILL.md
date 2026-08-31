---
name: story-writing-process
description: Use when starting, outlining, drafting, or revising a new Isles of Yum story (Felix & Alex bedtime story world). Also use when asked to plan a new arc, brainstorm a story idea, or pick up an in-progress story draft. Orchestrates the full outline-to-final-draft pipeline and calls in other Isles of Yum skills (world-consistency-check, naming-workshop, character-voice-guide, persona-review) at the right points. Do not use for unrelated creative writing outside this world.
---

# Isles of Yum — Story Writing Process

This is the orchestrator skill for writing a new story (or arc) in the Isles of
Yum world. It sequences the process and tells you which other skills to invoke
and when. It does not duplicate their content — read `docs/World_Guide.md` in
the repo for the full craft rules; this skill is about *process order*, not
the rules themselves.

## Before doing anything else

Read, in this order:
1. `docs/World_Guide.md` — full world, characters, craft rules, established
   travel/fleet logic, cast-priority rule (Felix & Alex are the core leads;
   others are supporting, brought in deliberately, not by default).
2. `docs/Story_Archive.md` — check what's already been done, and read the
   "what to watch for next time" notes on the most recent 2-3 entries.
3. `docs/Ideas_and_Arcs_Tracker.md` — if picking up a planned arc, confirm
   which seed is being used and its current framing.

Never start outlining without having read the current World Guide fresh —
it changes over time (new craft rules, new standing decisions), and stale
assumptions from an earlier session will produce inconsistent stories.

## The process

### 1. Brainstorm / scope the idea
- If choosing between multiple possible story ideas, stress-test each against
  the "five-ingredient bar" the project uses for judging whether an idea is
  strong enough: a specific wound (not generic sadness), a mid-story mystery
  pull, tension-flavour variety, a concrete emotional anchor object, and
  (for anything arc-level) a way the ending reframes what came before.
- Decide cast: default to Felix and Alex only unless the specific story
  genuinely benefits from more (see World Guide cast-priority rule). Don't
  add characters "for balance."
- If the story needs a new place, character, or object name — invoke the
  `naming-workshop` skill before locking anything in. Don't settle for the
  first name that comes to mind for anything load-bearing.
- Scope the location/setting properly before writing a single line of plot:
  what does this place actually look, sound, smell, feel like; what are its
  physical properties; how would you travel there (see World Guide's
  Travel & Fleet section — most stories no longer need the jigsaw-piece
  portal ritual; open in motion or already on-island instead).

### 2. Outline
Sketch: setting, the core problem (must fit one of the World Guide's
non-villain categories), one clear affirmation/theme, and a job for every
character who appears. Note the tension-type sequence across the story's
beats and check no two adjacent beats share the same flavour (dispute,
physical jeopardy, quiet mystery, warmth/reveal, puzzle-reconciliation, etc.
are different flavours — repeating one back-to-back is the failure mode, not
the total count).

### 3. Persona check the outline
Invoke the `persona-review` skill on the outline before drafting a word of
prose. At minimum run the two baseline personas (five-year-old listener,
editor). Pull in additional personas if relevant to this story's delivery
format (see that skill for the full list and when each applies).

### 4. Check consistency
Invoke `world-consistency-check` on the outline's new elements (any new
place, character, object, or claim about how the world works) before
drafting. Cheaper to catch a contradiction here than after a full draft.

### 5. Write the full draft
- For a short/medium story, write it in one pass.
- For a long or multi-location story, draft in sections, reviewing each
  section as it's written, then do one final full read-through at the end.
- While drafting, check dialogue and behaviour against `character-voice-guide`
  for every named character who speaks — don't let anyone's voice drift from
  their established pattern without a deliberate reason.
- Word count is a target (see World Guide for current story length norms),
  not a hard limit — give the story the length it actually needs.

### 6. Review
- Run at least one full review pass; run two in sequence for anything
  ambitious (second pass checks the first pass's suggested fixes against the
  *whole* story before applying them).
- Re-invoke `persona-review` on the full draft, not just the outline — some
  issues (pacing, a joke's timing, an emotional beat landing too fast) only
  show up once real prose exists.
- Run `world-consistency-check` again on the finished draft — drafting often
  introduces small new claims that weren't in the outline.

### 7. Cross-review before fixing
When multiple personas or checks raise notes, review the notes against each
other before acting on any single one. Two different lenses flagging the
same underlying issue is a strong signal it's real. Where different notes
point at the same passage, find one edit that serves all of them rather than
stacking separate fixes. Not everything flagged needs fixing — distinguish a
real gap from something minor and net-neutral.

### 8. Finalize
- Update `docs/Story_Archive.md` with a new entry (cast, length, islands
  featured, summary, what worked, what to watch for next time) — this is
  what future sessions will read before starting their own new story, so
  write it for that audience, not just as a diary entry.
- Check off the relevant item in `docs/Ideas_and_Arcs_Tracker.md` if this
  story used a tracked seed.
- If the story is going to be narrated, hand off to `audio-narration-prep`.

## Anti-patterns to avoid
- Starting to draft prose before the outline has cleared a persona check.
- Adding cousins/Mummy/Dad to a story "for balance" rather than because the
  story specifically needs them.
- Re-opening every story with the jigsaw-piece portal ritual by default —
  check the World Guide's Travel & Fleet section first.
- Treating the two baseline personas as sufficient when the story's actual
  delivery format (read-aloud, single-voice TTS, multi-voice TTS) would
  surface different problems.
