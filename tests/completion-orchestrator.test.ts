import { describe, expect, it } from "vitest";
import { RuntimeRequestError } from "../src/data/app-runtime-client";
import { commitOrQueueCompletion } from "../src/runtime/activity-player/completion-orchestrator";
import { createRoundAssessment, assessRoundPlacement, summarizeRoundAssessment } from "../src/runtime/activity-player/round-assessment";
import type { PendingCompletion, PendingCompletionRepository } from "../src/persistence/contracts";

const input = {
  parentUserId: "00000000-0000-0000-0000-0000000000a1",
  completionId: "00000000-0000-0000-0000-0000000000c1",
  startedAt: "2026-09-25T00:00:00.000Z",
  completedAt: "2026-09-25T00:01:00.000Z",
  assisted: false,
  requiresFull: false,
  assessmentSummary: summarizeRoundAssessment(createRoundAssessment()),
  beginSnapshot: { node_key: "alphabet-missing-letters", content_hash: "fixture" },
  pin: { childId: "00000000-0000-0000-0000-0000000000b1", activityId: "alphabet-missing-letters", activityVersion: "1.0.0", contentReleaseId: "00000000-0000-0000-0000-0000000000d1", nodeVersionId: "00000000-0000-0000-0000-0000000000d2", engineType: "E02_DRAG_DROP" as const, engineVersion: "1.0.0", contentHash: "fixture" },
};

describe("completion orchestrator", () => {
  it("commits the immutable pin unchanged", async () => {
    let request: unknown;
    const result = await commitOrQueueCompletion(input, { commitActivityCompletion: async (value) => { request = value; return { attemptId: input.completionId, resultId: input.completionId, completionId: input.completionId, idempotent: false }; } }, outbox());
    expect(result).toBe("committed");
    expect(request).toMatchObject({ releaseId: input.pin.contentReleaseId, nodeVersionId: input.pin.nodeVersionId, completionId: input.completionId, beginSnapshot: input.beginSnapshot });
  });

  it("preserves the pinned content requirement in the completion request", async () => {
    let request: unknown;
    await commitOrQueueCompletion(
      { ...input, requiresFull: true },
      { commitActivityCompletion: async (value) => { request = value; return { attemptId: input.completionId, resultId: input.completionId, completionId: input.completionId, idempotent: false }; } },
      outbox(),
    );
    expect(request).toMatchObject({ requiresFull: true });
  });

  it("preserves independent and trial-and-error assessment distinctions", async () => {
    const wrong = assessRoundPlacement(createRoundAssessment(), {
      itemId: "item-a",
      targetId: "target-b",
      correct: false,
      answerRevealed: false,
      engineIndependentlyAssessable: false,
    });
    const corrected = assessRoundPlacement(wrong.state, {
      itemId: "item-a",
      targetId: "target-a",
      correct: true,
      answerRevealed: false,
      engineIndependentlyAssessable: true,
    });
    let request: unknown;
    await commitOrQueueCompletion(
      { ...input, assessmentSummary: summarizeRoundAssessment(corrected.state) },
      { commitActivityCompletion: async (value) => { request = value; return { attemptId: input.completionId, resultId: input.completionId, completionId: input.completionId, idempotent: false }; } },
      outbox(),
    );
    expect(request).toMatchObject({
      resultPayload: {
        assessment: {
          independentCorrectPlacements: 0,
          trialAndErrorCorrectPlacements: 1,
          assistedCorrectPlacements: 0,
        },
      },
    });
  });

  it("durably queues the same completion ID on a transient failure", async () => {
    const repository = outbox();
    const result = await commitOrQueueCompletion(input, { commitActivityCompletion: async () => { throw new Error("network"); } }, repository);
    expect(result).toBe("queued");
    expect(repository.records).toMatchObject([{ completionId: input.completionId, request: { completionId: input.completionId, releaseId: input.pin.contentReleaseId, nodeVersionId: input.pin.nodeVersionId, source: "offline" } }]);
  });

  it("does not queue a rejected or revoked completion", async () => {
    const repository = outbox();
    await expect(commitOrQueueCompletion(input, { commitActivityCompletion: async () => { throw new RuntimeRequestError(403, "child_binding_not_active"); } }, repository)).resolves.toBe("blocked");
    expect(repository.records).toEqual([]);
  });
});

function outbox(): PendingCompletionRepository & { records: PendingCompletion[] } {
  const records: PendingCompletion[] = [];
  return {
    records,
    enqueue: async (record) => { records.push(record); },
    list: async () => records,
    remove: async () => {},
  };
}
