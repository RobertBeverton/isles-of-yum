---
name: world-consistency-check
description: Use when a new Isles of Yum story introduces a new place, character, creature, object, or claim about how the world works — before finalizing an outline and again before finalizing a draft. Checks new elements against docs/World_Guide.md and docs/Story_Archive.md for contradictions, accidental duplicate names, or continuity errors. Also use when asked to verify continuity or fact-check a story against established lore.
---

# World Consistency Check

A mechanical check, not a creative one. The goal is to catch contradictions
and duplication before they ship, the same way a linter catches a typo —
this should feel like running a checklist, not re-reading the whole world
from scratch each time.

## What to check

For every new element a story introduces (a place, a named character or
creature, a recurring object, or a claim about how something in the world
works — e.g. "this is how almond butter separates," "this is how the Fleet
progression works"), check it against:

1. **`docs/World_Guide.md`** — does this contradict an established fact
   (an island's known geography, a character's established personality or
   traits, a rule about how magic/travel/the jigsaw piece works)? Does the
   new name collide with or too-closely resemble an existing one (e.g. a new
   character named too similarly to Nib or Cardamom)?
2. **`docs/Story_Archive.md`** — has this place or character appeared before
   under a different description that this story doesn't match? Story
   Archive entries include "Islands Featured" fields for exactly this kind
   of cross-check.
3. **Internal consistency within the story itself** — does an object
   introduced in scene one behave the same way when it reappears later
   (World Guide craft rule 5, "plant then pay off")? Does a character's
   stated ability or trait hold consistently across the whole draft?

## What to do with findings

- **Hard contradiction** (e.g. an island described with different geography
  than its established entry, a character acting against a settled trait
  without in-story reason) — flag clearly and propose a fix before the story
  is considered finalized.
- **Soft overlap** (a new idea that's similar to but not quite the same as
  an existing one — e.g. two "hoarding out of insecurity" characters) — flag
  it, but this is a judgement call, not an automatic block. Note it and let
  the person decide if the similarity is a problem or an intentional echo.
- **New fact worth recording** — if the story establishes something new and
  reusable (a new island, a new named character, a new rule about the
  world), note that it should be added to `docs/World_Guide.md` as part of
  finalizing the story, not left to only exist inside the story prose.

## When to run this

Twice per story: once on the outline (cheap to fix contradictions before
prose exists), and once on the finished draft (drafting often introduces
small new claims that weren't in the outline — a throwaway sentence
describing what a place looks like, an offhand line about how something
works). Called from the `story-writing-process` skill at both points.

## Output format

A short list: element checked → verdict (clear / soft overlap / hard
contradiction) → one line of reasoning. Don't narrate the whole checking
process — just the findings.
