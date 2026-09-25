import type { GameSessionEvent, GameSessionState } from "../../domain/types";

export const idleGameSession: GameSessionState = {
  phase: "IDLE",
  attemptCount: 0,
  assisted: false
};

export function reduceGameSession(
  state: GameSessionState,
  event: GameSessionEvent
): GameSessionState {
  switch (event.type) {
    case "START":
      if (state.phase === "IDLE") {
        return { ...idleGameSession, phase: "INTRO", pin: event.pin };
      }
      if (state.phase === "INTRO" || state.phase === "RETRY") {
        return { ...state, phase: "ACTIVE" };
      }
      return state;

    case "ATTEMPT":
      if (state.phase !== "ACTIVE") return state;
      return {
        ...state,
        phase: "CHECKING",
        attemptCount: state.attemptCount + 1,
        lastAttempt: {
          trayItemId: event.trayItemId,
          targetId: event.targetId,
          correct: event.correct,
          independentlyAssessable: event.independentlyAssessable
        }
      };

    case "ATTEMPT_EVALUATED":
      if (state.phase !== "CHECKING" || !state.lastAttempt) return state;
      return {
        ...state,
        phase: state.lastAttempt.correct ? "FEEDBACK_POSITIVE" : "FEEDBACK_NEGATIVE"
      };

    case "HINT_USED":
      if (state.phase !== "ACTIVE") return state;
      return { ...state, assisted: state.assisted || event.answerRevealed };

    case "RETRY_REQUESTED":
      if (state.phase !== "FEEDBACK_NEGATIVE") return state;
      return { ...state, phase: "RETRY" };

    case "ADVANCE_ROUND":
      if (state.phase !== "FEEDBACK_POSITIVE") return state;
      return { ...state, phase: event.isFinalRound ? "ROUND_COMPLETE" : "ACTIVE" };

    case "COMPLETED":
      if (state.phase !== "ROUND_COMPLETE") return state;
      return { ...state, phase: "COMPLETING", completionId: event.completionId };

    case "COMMIT_SUCCEEDED":
      if (state.phase !== "COMPLETING") return state;
      return { ...state, phase: "COMPLETED" };

    case "ABANDONED":
      return state.phase === "IDLE" || state.phase === "COMPLETED" ? state : idleGameSession;
  }
}
