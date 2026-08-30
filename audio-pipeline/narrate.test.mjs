import { describe, it, expect } from "vitest";
import { parseScenes, splitIntoTurns, flagLowConfidence, mergeAdjacentTurns, packBatches, getArgValue } from "./narrate.mjs";

describe("parseScenes", () => {
  it("splits on scene-break lines", () => {
    const md = "Scene one.\n\n• • •\n\nScene two.";
    expect(parseScenes(md)).toEqual(["Scene one.", "Scene two."]);
  });

  it("returns a single scene when there is no break", () => {
    expect(parseScenes("Just one scene.")).toEqual(["Just one scene."]);
  });
});

describe("splitIntoTurns", () => {
  it("attributes a quote to the speaker named in an adjacent dialogue tag", () => {
    const text = `"Alex," said Felix, "the water's gone weird."`;
    const turns = splitIntoTurns(text);
    expect(turns).toEqual([
      { speaker: "FELIX", text: `"Alex," said Felix, "the water's gone weird."`, confident: true },
    ]);
  });

  it("marks narration-only sentences as NARRATOR", () => {
    const text = "The sea had been perfectly ordinary blue-green for ages.";
    const turns = splitIntoTurns(text);
    expect(turns).toEqual([
      { speaker: "NARRATOR", text, confident: true },
    ]);
  });

  it("marks a quote with no adjacent dialogue tag as low-confidence", () => {
    const text = `"Where did it go?"`;
    const turns = splitIntoTurns(text);
    expect(turns[0].confident).toBe(false);
  });

  it("does not misattribute speaker from a capitalized word inside the quote (Bug 1)", () => {
    const text = `"I said no," Felix said.`;
    const turns = splitIntoTurns(text);
    expect(turns).toEqual([
      { speaker: "FELIX", text, confident: true },
    ]);
  });

  it("does not split on a period inside a title abbreviation like Mr. (Bug 2)", () => {
    const text = `"Wait," said Mr. Smith, "not yet."`;
    const turns = splitIntoTurns(text);
    // The sentence must not be truncated at "Mr." — it should remain one
    // whole turn containing both quoted spans, not two turns where the
    // second ('Smith, "not yet."') is missing its opening context.
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toBe(text);
    expect(turns[0].confident).toBe(true);
  });

  it("handles a sentence with two separate quoted spans", () => {
    const text = `Felix said, "Yes, I did," then paused before adding "so there."`;
    const turns = splitIntoTurns(text);
    expect(turns).toHaveLength(1);
    expect(turns[0].speaker).toBe("FELIX");
    expect(turns[0].confident).toBe(true);
  });
});

describe("flagLowConfidence", () => {
  it("collects low-confidence turns with their line context", () => {
    const turns = [
      { speaker: "FELIX", text: "a", confident: true, line: 1 },
      { speaker: null, text: `"huh?"`, confident: false, line: 2 },
    ];
    const flagged = flagLowConfidence(turns);
    expect(flagged).toHaveLength(1);
    expect(flagged[0].line).toBe(2);
  });

  it("flags a speaker not present in the voice map", () => {
    const turns = [{ speaker: "MYSTERY_KID", text: `"hi"`, confident: true, line: 3 }];
    const flagged = flagLowConfidence(turns, { NARRATOR: "x", FELIX: "y" });
    expect(flagged).toHaveLength(1);
  });
});

describe("mergeAdjacentTurns", () => {
  it("merges consecutive turns from the same speaker", () => {
    const turns = [
      { speaker: "NARRATOR", text: "One.", confident: true },
      { speaker: "NARRATOR", text: "Two.", confident: true },
      { speaker: "FELIX", text: `"Three."`, confident: true },
    ];
    const merged = mergeAdjacentTurns(turns);
    expect(merged).toEqual([
      { speaker: "NARRATOR", text: "One. Two." },
      { speaker: "FELIX", text: `"Three."` },
    ]);
  });
});

describe("packBatches", () => {
  it("packs turns under the character limit without splitting a turn", () => {
    const turns = [
      { speaker: "NARRATOR", text: "a".repeat(1000) },
      { speaker: "NARRATOR", text: "b".repeat(1000) },
    ];
    const batches = packBatches(turns, 1800);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toEqual([turns[0]]);
    expect(batches[1]).toEqual([turns[1]]);
  });

  it("packs multiple small turns into one batch", () => {
    const turns = [
      { speaker: "NARRATOR", text: "short one" },
      { speaker: "FELIX", text: "short two" },
    ];
    const batches = packBatches(turns, 1800);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(2);
  });

  it("returns an empty array for no turns", () => {
    expect(packBatches([])).toEqual([]);
  });
});

describe("getArgValue", () => {
  it("returns the value following the flag when present", () => {
    expect(getArgValue(["--voice-map", "custom.json"], "--voice-map", "default.json")).toBe("custom.json");
  });

  it("returns the default when the flag is absent (Bug 3)", () => {
    // Regression for: rest[rest.indexOf(flag) + 1] silently returns rest[0]
    // (the wrong arg) when the flag isn't present, because indexOf gives -1.
    expect(getArgValue(["--out", "story.mp3"], "--voice-map", "default.json")).toBe("default.json");
  });

  it("returns the default when the flag is the last element with no following value", () => {
    expect(getArgValue(["--voice-map"], "--voice-map", "default.json")).toBe("default.json");
  });

  it("returns undefined when the flag is absent and no default is given", () => {
    expect(getArgValue(["--voice-map", "x.json"], "--out", undefined)).toBeUndefined();
  });
});
