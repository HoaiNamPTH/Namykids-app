export type RoundPlacementAssessment = {
  itemId: string;
  targetId: string;
  correct: boolean;
  answerRevealed: boolean;
  priorWrongItem: boolean;
  priorWrongTarget: boolean;
  independentlyAssessable: boolean;
};

export type RoundAssessmentState = {
  historyComplete: boolean;
  wrongItemIds: readonly string[];
  wrongTargetIds: readonly string[];
  placements: readonly RoundPlacementAssessment[];
  hintRevealed: boolean;
};

export type RoundAssessmentSummary = {
  version: 1;
  evidenceContinuity: "complete" | "unknown";
  hadIncorrectPlacement: boolean;
  hintRevealed: boolean;
  correctPlacements: number;
  independentCorrectPlacements: number;
  trialAndErrorCorrectPlacements: number;
  assistedCorrectPlacements: number;
};

type PlacementInput = {
  itemId: string;
  targetId: string;
  correct: boolean;
  answerRevealed: boolean;
  engineIndependentlyAssessable: boolean;
};

export function createRoundAssessment(historyComplete = true): RoundAssessmentState {
  return { historyComplete, wrongItemIds: [], wrongTargetIds: [], placements: [], hintRevealed: false };
}

export function assessRoundPlacement(
  state: RoundAssessmentState,
  input: PlacementInput,
): { state: RoundAssessmentState; placement: RoundPlacementAssessment } {
  const priorWrongItem = state.wrongItemIds.includes(input.itemId);
  const priorWrongTarget = state.wrongTargetIds.includes(input.targetId);
  const placement: RoundPlacementAssessment = {
    itemId: input.itemId,
    targetId: input.targetId,
    correct: input.correct,
    answerRevealed: input.answerRevealed,
    priorWrongItem,
    priorWrongTarget,
    independentlyAssessable: input.correct
      && input.engineIndependentlyAssessable
      && !input.answerRevealed
      && state.historyComplete
      && !priorWrongItem
      && !priorWrongTarget,
  };
  return {
    placement,
    state: {
      ...state,
      wrongItemIds: input.correct ? state.wrongItemIds : addUnique(state.wrongItemIds, input.itemId),
      wrongTargetIds: input.correct ? state.wrongTargetIds : addUnique(state.wrongTargetIds, input.targetId),
      placements: [...state.placements, placement],
    },
  };
}

export function isHintEligible(state: RoundAssessmentState): boolean {
  return state.wrongItemIds.length > 0 || state.wrongTargetIds.length > 0;
}

export function revealHintForRound(state: RoundAssessmentState): RoundAssessmentState {
  return isHintEligible(state) ? { ...state, hintRevealed: true } : state;
}

export function summarizeRoundAssessment(state: RoundAssessmentState): RoundAssessmentSummary {
  const correct = state.placements.filter((placement) => placement.correct);
  return {
    version: 1,
    evidenceContinuity: state.historyComplete ? "complete" : "unknown",
    hadIncorrectPlacement: isHintEligible(state),
    hintRevealed: state.hintRevealed,
    correctPlacements: correct.length,
    independentCorrectPlacements: correct.filter((placement) => placement.independentlyAssessable).length,
    trialAndErrorCorrectPlacements: correct.filter((placement) => !placement.answerRevealed && (placement.priorWrongItem || placement.priorWrongTarget)).length,
    assistedCorrectPlacements: correct.filter((placement) => placement.answerRevealed).length,
  };
}

export function restoreRoundAssessment(value: unknown): RoundAssessmentState {
  if (!isRoundAssessmentState(value)) return createRoundAssessment(false);
  return {
    historyComplete: value.historyComplete,
    wrongItemIds: [...value.wrongItemIds],
    wrongTargetIds: [...value.wrongTargetIds],
    placements: value.placements.map((placement) => ({ ...placement })),
    hintRevealed: value.hintRevealed,
  };
}

function addUnique(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values : [...values, value];
}

function isRoundAssessmentState(value: unknown): value is RoundAssessmentState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RoundAssessmentState>;
  return typeof candidate.historyComplete === "boolean"
    && isStringArray(candidate.wrongItemIds)
    && isStringArray(candidate.wrongTargetIds)
    && Array.isArray(candidate.placements)
    && candidate.placements.every(isRoundPlacementAssessment)
    && typeof candidate.hintRevealed === "boolean";
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRoundPlacementAssessment(value: unknown): value is RoundPlacementAssessment {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RoundPlacementAssessment>;
  return typeof candidate.itemId === "string"
    && typeof candidate.targetId === "string"
    && typeof candidate.correct === "boolean"
    && typeof candidate.answerRevealed === "boolean"
    && typeof candidate.priorWrongItem === "boolean"
    && typeof candidate.priorWrongTarget === "boolean"
    && typeof candidate.independentlyAssessable === "boolean";
}
