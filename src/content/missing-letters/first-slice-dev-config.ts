import type { AlphabetMissingLettersConfig } from "./schema";

/** Content-shaped development data only; real glyph/audio assets remain governed by the asset manifest. */
export const firstSliceDevConfig: AlphabetMissingLettersConfig = {
  activityId: "alphabet-missing-letters",
  activityVersion: "1.0.0-dev",
  contentReleaseId: "00000000-0000-4000-8000-000000000010",
  engineType: "E02_DRAG_DROP",
  engineVersion: "1.0.0",
  instructionAudioAssetId: "voice-instruction",
  instructionVisualAssetIds: ["missing-letters-scene", "alphabet-glyph-master"],
  orderedSequenceId: "approved-alphabet-sequence-v1",
  visibleSequence: ["glyph-01", "glyph-02", "glyph-03", "glyph-04", "glyph-05", "glyph-06"],
  missingPositions: [1, 3, 5],
  missingCount: 3,
  trayItems: [
    { id: "item-02", glyph: "glyph-02", accessibilityLabel: "Lựa chọn chữ 1" },
    { id: "item-04", glyph: "glyph-04", accessibilityLabel: "Lựa chọn chữ 2" },
    { id: "item-06", glyph: "glyph-06", accessibilityLabel: "Lựa chọn chữ 3" }
  ],
  trayShuffleSeed: "dev-round-seed-a",
  dropTargets: [
    { id: "target-1", position: 1, expectedTrayItemId: "item-02", accessibilityLabel: "Ô trống 1" },
    { id: "target-3", position: 3, expectedTrayItemId: "item-04", accessibilityLabel: "Ô trống 2" },
    { id: "target-5", position: 5, expectedTrayItemId: "item-06", accessibilityLabel: "Ô trống 3" }
  ],
  refreshableRoundConfig: { alternativeMissingPositionSets: [[0, 2, 4]] },
  feedback: {
    correctAudioAssetId: "voice-feedback",
    retryAudioAssetId: "voice-feedback",
    hintAudioAssetId: "voice-feedback",
    completionAudioAssetId: "voice-feedback"
  },
  accessibility: { nonDragAlternative: "select_then_place", instructionLabel: "Đặt từng chữ vào ô trống" },
  requiresFull: false,
  completionRuleId: "round-complete-v1",
  educationApprovalVersion: "APP-EDU-06"
};
