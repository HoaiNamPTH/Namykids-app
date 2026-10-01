import type { AudioCue } from "../../audio/audio-service";
import type { GameSessionPhase } from "../../domain/types";

export type ActivityPresentationStage = "instruction" | "active" | "complete";

export type PlacementMicroFeedback = {
  kind: "correct" | "retry";
  marker: "check" | "return";
  message: string;
};

export type AutomaticFeedbackTransition =
  | { action: "advance"; audioCue: AudioCue; feedback: PlacementMicroFeedback; isFinalRound: boolean }
  | { action: "request_retry"; audioCue: AudioCue; feedback: PlacementMicroFeedback }
  | { action: "resume_retry" };

export function activityPresentationStage(phase: GameSessionPhase): ActivityPresentationStage {
  if (phase === "ROUND_COMPLETE" || phase === "COMPLETING" || phase === "COMPLETED") return "complete";
  if (phase === "IDLE" || phase === "INTRO") return "instruction";
  return "active";
}

export function automaticFeedbackTransition(
  phase: GameSessionPhase,
  isFinalRound: boolean,
): AutomaticFeedbackTransition | null {
  if (phase === "FEEDBACK_POSITIVE") {
    return {
      action: "advance",
      audioCue: isFinalRound ? "completion" : "correct",
      feedback: {
        kind: "correct",
        marker: "check",
        message: isFinalRound ? "Chúc mừng con đã làm đúng" : "Con làm đúng rồi",
      },
      isFinalRound,
    };
  }
  if (phase === "FEEDBACK_NEGATIVE") {
    return {
      action: "request_retry",
      audioCue: "retry",
      feedback: { kind: "retry", marker: "return", message: "Con thử lại nhé" },
    };
  }
  if (phase === "RETRY") return { action: "resume_retry" };
  return null;
}
