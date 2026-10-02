import { describe, expect, it } from "vitest";
import { activityPresentationStage, automaticFeedbackTransition, childCompletionPresentation, foundationParentSummaryCopy, foundationPreviewAccessibility, foundationPreviewPresentation, positionsForCompletionAction, selectedLetterHelper } from "../src/runtime/activity-player/presentation";
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
      feedback: { message: "Chúc mừng con!" },
    });
    expect(activityPresentationStage("ROUND_COMPLETE")).toBe("complete");
  });

  it("keeps S07 child-facing with exactly two actions and no technical assessment copy", () => {
    expect(childCompletionPresentation).toEqual({
      title: "Chúc mừng con!",
      actions: ["Chơi mới", "Chơi lại"],
    });
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

  it("keeps the complete Foundation Preview copy matrix child- and parent-safe", () => {
    expect(foundationPreviewPresentation).toMatchObject({
      S01: { stateCode: "S01", title: "Chào con đến với NamyKids", actions: ["Chữ cái & vần", "Góc của ba mẹ"] },
      S02: { stateCode: "S02", actions: ["Bắt đầu chơi", "Quay lại"] },
      S03: { stateCode: "S03", actions: ["Nghe lại hướng dẫn", "Bắt đầu"] },
      S04: { stateCode: "S04", actions: ["Gợi ý", "Lượt mới"] },
      S07: { title: "Chúc mừng con!", actions: ["Chơi mới", "Chơi lại"] },
      S08: { stateCode: "S08", title: "Đang mở bài học..." },
      S09: { stateCode: "S09", actions: ["Quay lại bài học", "Góc của ba mẹ"] },
      S10: { stateCode: "S10", detailLabels: ["Tự làm đúng", "Thử và tự sửa", "Có gợi ý trợ giúp"], action: "Quay lại không gian của bé" },
      S11: { stateCode: "S11", action: "Về trang chủ" },
      S12: { stateCode: "S12", actions: ["Tải lại trang", "Về trang chủ"] },
    });

    const userFacingCopy = JSON.stringify({ foundationPreviewPresentation, foundationPreviewAccessibility });
    for (const forbidden of ["Independent", "Trial-and-error", "Assisted", "Missing Letters", "Child World", "Auth", "token", "outbox", "runtime", "content pin", "DEV_PLACEHOLDER", "Reveal", "genuine incorrect placement"]) {
      expect(userFacingCopy).not.toContain(forbidden);
    }
  });

  it("keeps selected-letter and accessibility guidance in natural Vietnamese", () => {
    expect(selectedLetterHelper("Ă")).toBe("Đã chọn Ă. Con hãy chạm một ô trống.");
    expect(foundationPreviewAccessibility).toEqual({
      hintAvailable: "Mở một ô chữ giúp con",
      hintUnavailable: "Nút gợi ý sẽ mở khi con cần trợ giúp",
      refreshHint: "Đổi một bộ vị trí chữ khuyết khác",
      dropTargetHint: "Chạm sau khi chọn thẻ, hoặc kéo thả thẻ vào đây",
    });
  });

  it("formats S10 assessment data with parent-friendly labels without losing the counts", () => {
    expect(foundationParentSummaryCopy({
      correctPlacements: 3,
      independentCorrectPlacements: 1,
      trialAndErrorCorrectPlacements: 1,
      assistedCorrectPlacements: 1,
    })).toEqual([
      "Lượt chơi vừa hoàn thành: 3 ô chữ đã điền đúng.",
      "• Tự làm đúng: 1 chữ",
      "• Thử và tự sửa: 1 chữ",
      "• Có gợi ý trợ giúp: 1 chữ",
    ]);
  });
});
