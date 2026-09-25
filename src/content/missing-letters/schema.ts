import { z } from "zod";

const trayItemSchema = z.object({
  id: z.string().min(1),
  glyph: z.string().min(1),
  accessibilityLabel: z.string().min(1)
});

const dropTargetSchema = z.object({
  id: z.string().min(1),
  position: z.number().int().nonnegative(),
  expectedTrayItemId: z.string().min(1),
  accessibilityLabel: z.string().min(1)
});

const missingPositionSetSchema = z.array(z.number().int().nonnegative()).min(2).max(6);

export const alphabetMissingLettersConfigSchema = z
  .object({
    activityId: z.string().min(1),
    activityVersion: z.string().min(1),
    contentReleaseId: z.string().uuid(),
    engineType: z.literal("E02_DRAG_DROP"),
    engineVersion: z.string().min(1),
    instructionAudioAssetId: z.string().min(1),
    instructionVisualAssetIds: z.array(z.string().min(1)).min(1),
    orderedSequenceId: z.string().min(1),
    visibleSequence: z.array(z.string().min(1)).min(3),
    missingPositions: missingPositionSetSchema,
    missingCount: z.number().int().min(2).max(6),
    trayItems: z.array(trayItemSchema).min(2).max(6),
    trayShuffleSeed: z.string().min(1),
    dropTargets: z.array(dropTargetSchema).min(2).max(6),
    refreshableRoundConfig: z.object({
      alternativeMissingPositionSets: z.array(missingPositionSetSchema).min(1)
    }),
    feedback: z.object({
      correctAudioAssetId: z.string().min(1),
      retryAudioAssetId: z.string().min(1),
      hintAudioAssetId: z.string().min(1),
      completionAudioAssetId: z.string().min(1)
    }),
    accessibility: z.object({
      nonDragAlternative: z.literal("select_then_place"),
      instructionLabel: z.string().min(1)
    }),
    requiresFull: z.boolean(),
    completionRuleId: z.string().min(1),
    educationApprovalVersion: z.string().min(1)
  })
  .superRefine((config, context) => {
    const missingSet = new Set(config.missingPositions);
    const targetPositions = new Set(config.dropTargets.map((target) => target.position));
    const trayIds = new Set(config.trayItems.map((item) => item.id));

    if (missingSet.size !== config.missingCount || config.missingPositions.length !== config.missingCount) {
      context.addIssue({ code: "custom", message: "missingPositions must match missingCount without duplicates" });
    }
    if (config.trayItems.length !== config.missingCount || config.dropTargets.length !== config.missingCount) {
      context.addIssue({ code: "custom", message: "trayItems and dropTargets must match missingCount" });
    }
    if (targetPositions.size !== config.missingCount || ![...missingSet].every((position) => targetPositions.has(position))) {
      context.addIssue({ code: "custom", message: "dropTargets must cover the configured missing positions" });
    }
    if (config.missingPositions.some((position) => position >= config.visibleSequence.length)) {
      context.addIssue({ code: "custom", message: "missing position is outside visibleSequence" });
    }
    if (config.dropTargets.some((target) => !trayIds.has(target.expectedTrayItemId))) {
      context.addIssue({ code: "custom", message: "each drop target must reference a configured tray item" });
    }
    const currentSignature = signature(config.missingPositions);
    for (const alternative of config.refreshableRoundConfig.alternativeMissingPositionSets) {
      if (alternative.length !== config.missingCount || signature(alternative) === currentSignature) {
        context.addIssue({ code: "custom", message: "refresh must provide a distinct missing-position set of the same difficulty" });
      }
      if (alternative.some((position) => position >= config.visibleSequence.length)) {
        context.addIssue({ code: "custom", message: "refresh position is outside visibleSequence" });
      }
    }
  });

export type AlphabetMissingLettersConfig = z.infer<typeof alphabetMissingLettersConfigSchema>;

export function parseAlphabetMissingLettersConfig(input: unknown): AlphabetMissingLettersConfig {
  return alphabetMissingLettersConfigSchema.parse(input);
}

export function signature(positions: readonly number[]): string {
  return [...positions].sort((left, right) => left - right).join(":");
}
