import { describe, expect, it } from "vitest";
import { RuntimeRequestError } from "../src/data/app-runtime-client";
import type { RuntimeDataGateway } from "../src/data/contracts";
import type { PendingCompletion, PendingCompletionRepository } from "../src/persistence/contracts";
import { reconcilePendingCompletions } from "../src/sync/outbox-reconciliation";

const record: PendingCompletion = {
  completionId: "00000000-0000-0000-0000-000000000001",
  parentUserId: "00000000-0000-0000-0000-000000000002",
  childId: "00000000-0000-0000-0000-000000000003",
  activityId: "alphabet-missing-letters",
  activityVersion: "1.0.0",
  contentReleaseId: "00000000-0000-0000-0000-000000000004",
  queuedAt: "2026-09-25T00:00:00.000Z",
  request: {
    childId: "00000000-0000-0000-0000-000000000003",
    completionId: "00000000-0000-0000-0000-000000000001",
    releaseId: "00000000-0000-0000-0000-000000000004",
    nodeVersionId: "00000000-0000-0000-0000-000000000005",
    attemptId: null,
    startedAt: "2026-09-25T00:00:00.000Z",
    source: "offline",
    beginSnapshot: {},
    outcome: "completed",
    score: null,
    assisted: false,
    completedAt: "2026-09-25T00:01:00.000Z",
    resultPayload: {},
    progressStatus: "completed",
    resumePayload: null,
    requiresFull: false
  }
};

describe("outbox reconciliation", () => {
  it("refreshes auth after 401 and retries the same stable completion ID", async () => {
    const removed: string[] = [];
    const repository = fakeRepository(removed);
    let calls = 0;
    const runtime: Pick<RuntimeDataGateway, "commitActivityCompletion"> = {
      async commitActivityCompletion(request) {
        calls += 1;
        expect(request.completionId).toBe(record.completionId);
        if (calls === 1) throw new RuntimeRequestError(401, "invalid_token");
        return { attemptId: record.request.nodeVersionId, resultId: record.request.releaseId, completionId: record.completionId, idempotent: true };
      }
    };

    await expect(reconcilePendingCompletions([record], repository, runtime, async () => "fresh-token")).resolves.toEqual([
      { completionId: record.completionId, status: "committed" }
    ]);
    expect(calls).toBe(2);
    expect(removed).toEqual([record.completionId]);
  });

  it("stops protected retry after revoked binding without removing the pending record", async () => {
    const removed: string[] = [];
    const repository = fakeRepository(removed);
    const runtime: Pick<RuntimeDataGateway, "commitActivityCompletion"> = {
      async commitActivityCompletion() {
        throw new RuntimeRequestError(403, "child_binding_not_active");
      }
    };

    await expect(reconcilePendingCompletions([record], repository, runtime, async () => "fresh-token")).resolves.toEqual([
      { completionId: record.completionId, status: "blocked" }
    ]);
    expect(removed).toEqual([]);
  });
});

function fakeRepository(removed: string[]): PendingCompletionRepository {
  return {
    async enqueue() {},
    async list() { return []; },
    async remove(pending) { removed.push(pending.completionId); }
  };
}
