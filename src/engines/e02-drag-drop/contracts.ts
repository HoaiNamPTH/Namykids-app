import type { AlphabetMissingLettersConfig } from "../../content/missing-letters/schema";

export type E02InputMode = "drag" | "select_then_place";

export type E02DropInput = {
  trayItemId: string;
  targetId: string;
  inputMode: E02InputMode;
  answerRevealed: boolean;
};

export type E02DropResult = {
  accepted: boolean;
  correct: boolean;
  independentlyAssessable: boolean;
  feedback: "positive" | "gentle_retry" | "invalid";
};

/** E02 emits semantic results only; runtime owns navigation and persistence. */
export interface DragDropEngine {
  evaluateDrop(config: AlphabetMissingLettersConfig, input: E02DropInput): E02DropResult;
  selectRefreshPositions(config: AlphabetMissingLettersConfig, currentPositions: readonly number[]): readonly number[];
}

export const e02DragDropEngine: DragDropEngine = {
  evaluateDrop(config, input) {
    const target = config.dropTargets.find((candidate) => candidate.id === input.targetId);
    const itemExists = config.trayItems.some((candidate) => candidate.id === input.trayItemId);
    if (!target || !itemExists) {
      return { accepted: false, correct: false, independentlyAssessable: false, feedback: "invalid" };
    }

    const correct = target.expectedTrayItemId === input.trayItemId;
    return {
      accepted: correct,
      correct,
      independentlyAssessable: correct && !input.answerRevealed,
      feedback: correct ? "positive" : "gentle_retry"
    };
  },

  selectRefreshPositions(config, currentPositions) {
    const current = [...currentPositions].sort((left, right) => left - right).join(":");
    const next = config.refreshableRoundConfig.alternativeMissingPositionSets.find(
      (candidate) => [...candidate].sort((left, right) => left - right).join(":") !== current
    );
    return next ? [...next] : [...currentPositions];
  }
};
