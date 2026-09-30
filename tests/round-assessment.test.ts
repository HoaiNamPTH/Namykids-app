import { describe, expect, it } from "vitest";
import { idleGameSession, reduceGameSession } from "../src/runtime/game-session/reducer";
import {
  assessRoundPlacement,
  createRoundAssessment,
  isHintEligible,
  revealHintForRound,
} from "../src/runtime/activity-player/round-assessment";

describe("round education assessment", () => {
  it("keeps a clean first-attempt correct placement independent", () => {
    const result = assessRoundPlacement(createRoundAssessment(), correctPlacement("item-a", "target-a"));
    expect(result.placement.independentlyAssessable).toBe(true);
  });

  it("does not count a later correct placement as independent after the same item was wrong", () => {
    const wrong = assessRoundPlacement(createRoundAssessment(), wrongPlacement("item-a", "target-b"));
    const corrected = assessRoundPlacement(wrong.state, correctPlacement("item-a", "target-a"));
    expect(corrected.placement).toMatchObject({ priorWrongItem: true, independentlyAssessable: false });
  });

  it("does not count a later correct placement as independent after the same target was wrong", () => {
    const wrong = assessRoundPlacement(createRoundAssessment(), wrongPlacement("item-b", "target-a"));
    const corrected = assessRoundPlacement(wrong.state, correctPlacement("item-a", "target-a"));
    expect(corrected.placement).toMatchObject({ priorWrongTarget: true, independentlyAssessable: false });
  });

  it("keeps Hint unavailable for fresh ACTIVE state and unlocks only after a genuine wrong placement", () => {
    const fresh = createRoundAssessment();
    expect(isHintEligible(fresh)).toBe(false);
    expect(revealHintForRound(fresh)).toBe(fresh);

    const cleanCorrect = assessRoundPlacement(fresh, correctPlacement("item-a", "target-a"));
    expect(isHintEligible(cleanCorrect.state)).toBe(false);

    const wrong = assessRoundPlacement(fresh, wrongPlacement("item-a", "target-b"));
    expect(isHintEligible(wrong.state)).toBe(true);
  });

  it("does not unlock Hint from elapsed-state substitutes or a fixed number of clean attempts", () => {
    const first = assessRoundPlacement(createRoundAssessment(), correctPlacement("item-a", "target-a"));
    const second = assessRoundPlacement(first.state, correctPlacement("item-b", "target-b"));
    const third = assessRoundPlacement(second.state, correctPlacement("item-c", "target-c"));

    expect(isHintEligible(third.state)).toBe(false);
    expect(isHintEligible(createRoundAssessment())).toBe(false);
  });

  it("marks a revealed Hint placement assisted and non-independent", () => {
    const wrong = assessRoundPlacement(createRoundAssessment(), wrongPlacement("item-a", "target-b"));
    const revealed = revealHintForRound(wrong.state);
    const hinted = assessRoundPlacement(revealed, {
      ...correctPlacement("item-a", "target-a"),
      answerRevealed: true,
      engineIndependentlyAssessable: false,
    });
    const active = { ...idleGameSession, phase: "ACTIVE" as const };
    const assisted = reduceGameSession(active, { type: "HINT_USED", answerRevealed: true });

    expect(revealed.hintRevealed).toBe(true);
    expect(hinted.placement.independentlyAssessable).toBe(false);
    expect(assisted.assisted).toBe(true);
  });

  it("fails closed when restored history is unavailable", () => {
    const result = assessRoundPlacement(createRoundAssessment(false), correctPlacement("item-a", "target-a"));
    expect(result.placement.independentlyAssessable).toBe(false);
    expect(isHintEligible(result.state)).toBe(false);
  });
});

function correctPlacement(itemId: string, targetId: string) {
  return { itemId, targetId, correct: true, answerRevealed: false, engineIndependentlyAssessable: true };
}

function wrongPlacement(itemId: string, targetId: string) {
  return { itemId, targetId, correct: false, answerRevealed: false, engineIndependentlyAssessable: false };
}
