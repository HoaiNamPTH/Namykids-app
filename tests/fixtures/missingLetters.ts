import type { AlphabetMissingLettersConfig } from "../../src/content/missing-letters/schema";

export function makeMissingLettersConfig(): AlphabetMissingLettersConfig {
  return {
    activityId: "alphabet-missing-letters",
    activityVersion: "1.0.0",
    contentReleaseId: "00000000-0000-4000-8000-000000000010",
    engineType: "E02_DRAG_DROP",
    engineVersion: "1.0.0",
    instructionAudioAssetId: "audio-instruction-v1",
    instructionVisualAssetIds: ["visual-sequence-v1"],
    orderedSequenceId: "approved-alphabet-sequence-v1",
    visibleSequence: ["glyph-01", "glyph-02", "glyph-03", "glyph-04", "glyph-05", "glyph-06"],
    missingPositions: [1, 3, 5],
    missingCount: 3,
    trayItems: [
      { id: "item-02", glyph: "glyph-02", accessibilityLabel: "Letter option 1" },
      { id: "item-04", glyph: "glyph-04", accessibilityLabel: "Letter option 2" },
      { id: "item-06", glyph: "glyph-06", accessibilityLabel: "Letter option 3" }
    ],
    trayShuffleSeed: "round-seed-a",
    dropTargets: [
      { id: "target-1", position: 1, expectedTrayItemId: "item-02", accessibilityLabel: "Gap 1" },
      { id: "target-3", position: 3, expectedTrayItemId: "item-04", accessibilityLabel: "Gap 2" },
      { id: "target-5", position: 5, expectedTrayItemId: "item-06", accessibilityLabel: "Gap 3" }
    ],
    refreshableRoundConfig: { alternativeMissingPositionSets: [[0, 2, 4]] },
    feedback: {
      correctAudioAssetId: "audio-correct-v1",
      retryAudioAssetId: "audio-retry-v1",
      hintAudioAssetId: "audio-hint-v1",
      completionAudioAssetId: "audio-completion-v1"
    },
    accessibility: { nonDragAlternative: "select_then_place", instructionLabel: "Place each missing letter" },
    requiresFull: false,
    completionRuleId: "round-complete-v1",
    educationApprovalVersion: "APP-EDU-06"
  };
}
