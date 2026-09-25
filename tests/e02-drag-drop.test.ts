import { describe, expect, it } from "vitest";
import { e02DragDropEngine } from "../src/engines/e02-drag-drop/contracts";
import { makeMissingLettersConfig } from "./fixtures/missingLetters";

describe("E02 drag-and-drop contract", () => {
  it("accepts a correct semantic placement without engine navigation or persistence", () => {
    const result = e02DragDropEngine.evaluateDrop(makeMissingLettersConfig(), {
      trayItemId: "item-02",
      targetId: "target-1",
      inputMode: "drag",
      answerRevealed: false
    });

    expect(result).toEqual({
      accepted: true,
      correct: true,
      independentlyAssessable: true,
      feedback: "positive"
    });
  });

  it("returns a gentle retry for a wrong placement and does not count an answer-revealed placement independently", () => {
    const config = makeMissingLettersConfig();
    const wrong = e02DragDropEngine.evaluateDrop(config, {
      trayItemId: "item-04",
      targetId: "target-1",
      inputMode: "select_then_place",
      answerRevealed: false
    });
    const assisted = e02DragDropEngine.evaluateDrop(config, {
      trayItemId: "item-02",
      targetId: "target-1",
      inputMode: "select_then_place",
      answerRevealed: true
    });

    expect(wrong).toMatchObject({ accepted: false, feedback: "gentle_retry" });
    expect(assisted).toMatchObject({ correct: true, independentlyAssessable: false });
  });

  it("selects a different missing-position set for a valid refresh boundary", () => {
    const config = makeMissingLettersConfig();

    expect(e02DragDropEngine.selectRefreshPositions(config, config.missingPositions)).toEqual([0, 2, 4]);
  });
});
