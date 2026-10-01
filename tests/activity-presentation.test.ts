import { describe, expect, it } from "vitest";
import { activityPresentationStage, automaticFeedbackTransition } from "../src/runtime/activity-player/presentation";

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
});
