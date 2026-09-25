import { describe, expect, it } from "vitest";
import type { SessionPin } from "../src/domain/types";
import { idleGameSession, reduceGameSession } from "../src/runtime/game-session/reducer";

const pin: SessionPin = {
  childId: "00000000-0000-0000-0000-000000000001",
  activityId: "alphabet-missing-letters",
  activityVersion: "1.0.0",
  contentReleaseId: "00000000-0000-0000-0000-000000000002",
  engineType: "E02_DRAG_DROP",
  engineVersion: "1.0.0"
};

describe("GameSession reducer", () => {
  it("moves through instruction, attempt feedback, retry, and completion without side effects", () => {
    const intro = reduceGameSession(idleGameSession, { type: "START", pin });
    const active = reduceGameSession(intro, { type: "START", pin });
    const checking = reduceGameSession(active, {
      type: "ATTEMPT",
      trayItemId: "item-a",
      targetId: "target-a",
      correct: false,
      independentlyAssessable: true
    });
    const negative = reduceGameSession(checking, { type: "ATTEMPT_EVALUATED" });
    const retry = reduceGameSession(negative, { type: "RETRY_REQUESTED" });
    const retryActive = reduceGameSession(retry, { type: "START", pin });
    const correctChecking = reduceGameSession(retryActive, {
      type: "ATTEMPT",
      trayItemId: "item-a",
      targetId: "target-a",
      correct: true,
      independentlyAssessable: true
    });
    const positive = reduceGameSession(correctChecking, { type: "ATTEMPT_EVALUATED" });
    const roundComplete = reduceGameSession(positive, { type: "ADVANCE_ROUND", isFinalRound: true });
    const completing = reduceGameSession(roundComplete, {
      type: "COMPLETED",
      completionId: "00000000-0000-0000-0000-000000000003"
    });

    expect([intro.phase, active.phase, checking.phase, negative.phase, retry.phase]).toEqual([
      "INTRO",
      "ACTIVE",
      "CHECKING",
      "FEEDBACK_NEGATIVE",
      "RETRY"
    ]);
    expect(completing.phase).toBe("COMPLETING");
    expect(reduceGameSession(completing, { type: "COMMIT_SUCCEEDED" }).phase).toBe("COMPLETED");
  });

  it("marks answer-revealing support as assisted and resets abandoned sessions", () => {
    const active = reduceGameSession(reduceGameSession(idleGameSession, { type: "START", pin }), { type: "START", pin });
    const assisted = reduceGameSession(active, { type: "HINT_USED", answerRevealed: true });

    expect(assisted.assisted).toBe(true);
    expect(reduceGameSession(assisted, { type: "ABANDONED" })).toEqual(idleGameSession);
  });
});
