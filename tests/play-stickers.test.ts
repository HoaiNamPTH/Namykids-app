import { describe, expect, it } from "vitest";
import { LANGUAGE_GAMES } from "../src/play/catalog";
import { withCompletion, type Progress } from "../src/play/progress";
import { STICKERS, earnedStickers } from "../src/play/stickers";

describe("sticker album", () => {
  it("has one sticker per Language game, each with a praise word", () => {
    expect(STICKERS.map((s) => s.gameId)).toEqual(LANGUAGE_GAMES.map((g) => g.id));
    STICKERS.forEach((s) => expect(s.praise.length).toBeGreaterThan(3));
  });

  it("is earned only by finishing the Khó level", () => {
    let p: Progress = { best: {}, log: [] };
    p = withCompletion(p, "tim-do-vat", 0, 1);
    p = withCompletion(p, "tim-do-vat", 1, 2);
    expect(earnedStickers(p)).toHaveLength(0);
    p = withCompletion(p, "tim-do-vat", 2, 3);
    expect(earnedStickers(p).map((s) => s.gameId)).toEqual(["tim-do-vat"]);
  });
});
