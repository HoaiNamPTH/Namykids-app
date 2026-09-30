import { RuntimeRequestError } from "../../data/app-runtime-client";
import type { RuntimeDataGateway } from "../../data/contracts";
import type { CompletionCommitRequest, SessionPin } from "../../domain/types";
import type { PendingCompletion, PendingCompletionRepository } from "../../persistence/contracts";
import type { RoundAssessmentSummary } from "./round-assessment";

export type CompletionInput = {
  parentUserId: string;
  pin: SessionPin;
  completionId: string;
  startedAt: string;
  completedAt: string;
  assisted: boolean;
  requiresFull: boolean;
  beginSnapshot: Record<string, unknown>;
  assessmentSummary: RoundAssessmentSummary;
};

export async function commitOrQueueCompletion(
  input: CompletionInput,
  runtime: Pick<RuntimeDataGateway, "commitActivityCompletion">,
  outbox: PendingCompletionRepository,
): Promise<"committed" | "queued" | "blocked"> {
  const request: CompletionCommitRequest = {
    childId: input.pin.childId,
    completionId: input.completionId,
    releaseId: input.pin.contentReleaseId,
    nodeVersionId: input.pin.nodeVersionId,
    attemptId: null,
    startedAt: input.startedAt,
    source: "online",
    beginSnapshot: input.beginSnapshot,
    outcome: "completed",
    score: null,
    assisted: input.assisted,
    completedAt: input.completedAt,
    resultPayload: { engine: "E02", outcome: "completed", assessment: input.assessmentSummary },
    progressStatus: "completed",
    resumePayload: null,
    requiresFull: input.requiresFull,
  };
  try {
    await runtime.commitActivityCompletion(request);
    return "committed";
  } catch (error) {
    if (error instanceof RuntimeRequestError && error.status >= 400 && error.status < 500) return "blocked";
    const record: PendingCompletion = {
      completionId: input.completionId,
      parentUserId: input.parentUserId,
      childId: input.pin.childId,
      activityId: input.pin.activityId,
      activityVersion: input.pin.activityVersion,
      contentReleaseId: input.pin.contentReleaseId,
      request: { ...request, source: "offline" },
      queuedAt: input.completedAt,
    };
    await outbox.enqueue(record);
    return "queued";
  }
}
