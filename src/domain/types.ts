export type Uuid = string;

export type EngineCode = "E01_SELECT" | "E02_DRAG_DROP" | "E04_TRACE";
export type Entitlement = "LIMITED" | "FULL";
export type CompletionSource = "online" | "offline";

export const gameSessionPhases = [
  "IDLE",
  "INTRO",
  "ACTIVE",
  "CHECKING",
  "FEEDBACK_POSITIVE",
  "FEEDBACK_NEGATIVE",
  "RETRY",
  "ROUND_COMPLETE",
  "COMPLETING",
  "COMPLETED"
] as const;

export type GameSessionPhase = (typeof gameSessionPhases)[number];

export type SessionPin = {
  childId: Uuid;
  activityId: string;
  activityVersion: string;
  contentReleaseId: Uuid;
  engineType: EngineCode;
  engineVersion?: string;
};

export type GameSessionState = {
  phase: GameSessionPhase;
  pin?: SessionPin;
  attemptCount: number;
  assisted: boolean;
  completionId?: Uuid;
  lastAttempt?: {
    trayItemId: string;
    targetId: string;
    correct: boolean;
    independentlyAssessable: boolean;
  };
};

export type GameSessionEvent =
  | { type: "START"; pin: SessionPin }
  | {
      type: "ATTEMPT";
      trayItemId: string;
      targetId: string;
      correct: boolean;
      independentlyAssessable: boolean;
    }
  | { type: "ATTEMPT_EVALUATED" }
  | { type: "HINT_USED"; answerRevealed: boolean }
  | { type: "RETRY_REQUESTED" }
  | { type: "ADVANCE_ROUND"; isFinalRound: boolean }
  | { type: "COMPLETED"; completionId: Uuid }
  | { type: "COMMIT_SUCCEEDED" }
  | { type: "ABANDONED" };

export type CompletionCommitRequest = {
  parentUserId: Uuid;
  childId: Uuid;
  completionId: Uuid;
  releaseId: Uuid;
  nodeVersionId: Uuid;
  attemptId: Uuid | null;
  startedAt: string;
  source: CompletionSource;
  beginSnapshot: Record<string, unknown>;
  outcome: string;
  score: number | null;
  assisted: boolean;
  completedAt: string;
  resultPayload: Record<string, unknown>;
  progressStatus: string;
  resumePayload: Record<string, unknown> | null;
  requiresFull: boolean;
};
