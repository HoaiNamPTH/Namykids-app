import type { CompletionCommitRequest, Entitlement, Uuid } from "../domain/types";

export type VerifiedSession = {
  parentUserId: Uuid;
  expiresAt: string;
};

export type ChildBinding = {
  parentUserId: Uuid;
  childId: Uuid;
  status: "active" | "revoked";
};

export type EntitlementSnapshot = {
  parentUserId: Uuid;
  entitlement: Entitlement;
  expiresAt: string | null;
  refreshedAt: string;
};

export type CompletionCommitResponse = {
  attemptId: Uuid;
  resultId: Uuid;
  completionId: Uuid;
  idempotent: boolean;
};

/** Build Pass 2 implements these trusted-boundary adapters; UI and engines do not access tables. */
export interface RuntimeDataGateway {
  recoverVerifiedSession(): Promise<VerifiedSession | null>;
  getChildBinding(childId: Uuid): Promise<ChildBinding | null>;
  getEntitlement(parentUserId: Uuid): Promise<EntitlementSnapshot>;
  commitActivityCompletion(request: CompletionCommitRequest): Promise<CompletionCommitResponse>;
}

export interface ProgressReadRepository {
  getChildProgress(childId: Uuid): Promise<readonly { nodeKey: string; status: string }[]>;
}
