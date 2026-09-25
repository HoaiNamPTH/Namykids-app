import { describe, expect, it } from "vitest";
import { alphabetMissingLettersConfigSchema, parseAlphabetMissingLettersConfig } from "../src/content/missing-letters/schema";
import { makeMissingLettersConfig } from "./fixtures/missingLetters";

describe("Alphabet Missing Letters config", () => {
  it("accepts a content-driven three-gap E02 round with a non-drag alternative", () => {
    const config = parseAlphabetMissingLettersConfig(makeMissingLettersConfig());

    expect(config.engineType).toBe("E02_DRAG_DROP");
    expect(config.missingCount).toBe(3);
    expect(config.accessibility.nonDragAlternative).toBe("select_then_place");
  });

  it("rejects a fixed refresh layout or an inconsistent missing count", () => {
    const invalid = makeMissingLettersConfig();
    invalid.missingCount = 4;
    invalid.refreshableRoundConfig.alternativeMissingPositionSets = [[1, 3, 5, 6]];

    expect(alphabetMissingLettersConfigSchema.safeParse(invalid).success).toBe(false);
  });
});
