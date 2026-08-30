import { describe, it, expect } from "vitest";
import { parseScenes, splitIntoTurns, flagLowConfidence, mergeAdjacentTurns, packBatches } from "./narrate.mjs";

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
});
