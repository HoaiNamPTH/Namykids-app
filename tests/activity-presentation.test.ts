import { describe, expect, it } from "vitest";
import { activityPresentationStage, automaticFeedbackTransition, childCompletionPresentation, positionsForCompletionAction } from "../src/runtime/activity-player/presentation";
import { firstSliceDevConfig } from "../src/content/missing-letters/first-slice-dev-config";

describe("activity feedback presentation", () => {
  it("keeps non-final correct feedback in the active scene and advances automatically", () => {
    expect(activityPresentationStage("FEEDBACK_POSITIVE")).toBe("active");
    expect(automaticFeedbackTransition("FEEDBACK_POSITIVE", false)).toMatchObject({
      action: "advance",
      audioCue: "correct",
      isFinalRound: false,
      feedback: { kind: "correct", marker: "check", message: "Con làm đúng rồi" },
    });
  });

  it("keeps wrong feedback in the active scene and requests a non-blocking retry", () => {
    expect(activityPresentationStage("FEEDBACK_NEGATIVE")).toBe("active");
    expect(activityPresentationStage("RETRY")).toBe("active");
    expect(automaticFeedbackTransition("FEEDBACK_NEGATIVE", false)).toMatchObject({
      action: "request_retry",
      audioCue: "retry",
      feedback: { kind: "retry", marker: "return", message: "Con thử lại nhé" },
    });
  });

  it("moves to completion only after the final correct placement", () => {
    expect(automaticFeedbackTransition("FEEDBACK_POSITIVE", true)).toMatchObject({
      action: "advance",
      audioCue: "completion",
      isFinalRound: true,
      feedback: { message: "Chúc mừng con đã làm đúng" },
    });
    expect(activityPresentationStage("ROUND_COMPLETE")).toBe("complete");
  });

  it("keeps S07 child-facing with exactly two actions and no technical assessment copy", () => {
    expect(childCompletionPresentation.actions).toEqual(["Chơi mới", "Chơi lại"]);
    const childCopy = JSON.stringify(childCompletionPresentation);
    for (const forbidden of [
      "Hoàn thành 3 ô trống",
      "Independent",
      "Trial-and-error",
      "Assisted",
      "mastery",
      "Góc của ba mẹ",
      "Offline",
      "Sync",
    ]) {
      expect(childCopy).not.toContain(forbidden);
    }
  });

  it("maps Chơi mới to a new configured set and Chơi lại to the current set", () => {
    expect(positionsForCompletionAction("Chơi mới", firstSliceDevConfig, [1, 3, 5])).toEqual([0, 2, 4]);
    expect(positionsForCompletionAction("Chơi lại", firstSliceDevConfig, [1, 3, 5])).toEqual([1, 3, 5]);
  });
});
