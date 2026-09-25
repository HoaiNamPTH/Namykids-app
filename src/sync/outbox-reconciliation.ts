import type { RuntimeDataGateway } from "../data/contracts";
import { RuntimeRequestError } from "../data/app-runtime-client";
import type { PendingCompletion, PendingCompletionRepository } from "../persistence/contracts";

export type OutboxReconciliationResult = {
  completionId: string;
  status: "committed" | "blocked" | "rejected" | "retryable";
};

export type WebSessionRefresh = () => Promise<string | null>;

/** Replays stable completion IDs only; canonical idempotency resolves missed responses safely. */
export async function reconcilePendingCompletions(
  records: readonly PendingCompletion[],
  repository: PendingCompletionRepository,
  runtime: Pick<RuntimeDataGateway, "commitActivityCompletion">,
  refreshWebSession: WebSessionRefresh
): Promise<readonly OutboxReconciliationResult[]> {
  const results: OutboxReconciliationResult[] = [];
  for (const record of records) {
    results.push(await reconcileOne(record, repository, runtime, refreshWebSession));
  }
  return results;
}

async function reconcileOne(
  record: PendingCompletion,
  repository: PendingCompletionRepository,
  runtime: Pick<RuntimeDataGateway, "commitActivityCompletion">,
  refreshWebSession: WebSessionRefresh
): Promise<OutboxReconciliationResult> {
  try {
    await runtime.commitActivityCompletion(record.request);
    await repository.remove(record);
    return { completionId: record.completionId, status: "committed" };
  } catch (error) {
    if (!(error instanceof RuntimeRequestError)) {
      return { completionId: record.completionId, status: "retryable" };
    }
    if (error.status === 401) return retryAfterWebAuthRefresh(record, repository, runtime, refreshWebSession);
    if (error.status === 403) return { completionId: record.completionId, status: "blocked" };
    if (error.status === 409 || error.status === 422) return { completionId: record.completionId, status: "rejected" };
    return { completionId: record.completionId, status: "retryable" };
  }
}

async function retryAfterWebAuthRefresh(
  record: PendingCompletion,
  repository: PendingCompletionRepository,
  runtime: Pick<RuntimeDataGateway, "commitActivityCompletion">,
  refreshWebSession: WebSessionRefresh
): Promise<OutboxReconciliationResult> {
  if (!(await refreshWebSession())) return { completionId: record.completionId, status: "blocked" };
  try {
    await runtime.commitActivityCompletion(record.request);
    await repository.remove(record);
    return { completionId: record.completionId, status: "committed" };
  } catch (error) {
    if (error instanceof RuntimeRequestError && error.status === 403) {
      return { completionId: record.completionId, status: "blocked" };
    }
    if (error instanceof RuntimeRequestError && (error.status === 409 || error.status === 422)) {
      return { completionId: record.completionId, status: "rejected" };
    }
    return { completionId: record.completionId, status: "retryable" };
  }
}
