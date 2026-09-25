import type { CompletionCommitRequest, Entitlement, Uuid } from "../domain/types";

export type VerifiedSession = {
  parentUserId: Uuid;
};

export type EntitlementSnapshot = {
  entitlement: Entitlement;
  sourceRevision: string | null;
  effectiveAt: string | null;
  expiresAt: string | null;
  refreshedAt: string | null;
  stale: boolean;
};

export type DeviceRegistration = {
  installationId: Uuid;
  status: "active";
  activeDeviceCount: number;
};

export type RuntimeProgress = {
  progress: readonly {
    nodeKey: string;
    releaseId: Uuid;
    status: string;
    lastResultId: Uuid | null;
    updatedAt: string;
  }[];
  resume: {
    releaseId: Uuid;
    nodeVersionId: Uuid;
    engineCode: "E01" | "E02" | "E04";
    engineVersion: string;
    resumePayload: Record<string, unknown>;
    updatedAt: string;
  } | null;
};

export type CompletionCommitResponse = {
  attemptId: Uuid;
  resultId: Uuid;
  completionId: Uuid;
  idempotent: boolean;
};

/** Build Pass 2 implements these trusted-boundary adapters; UI and engines do not access tables. */
export interface RuntimeDataGateway {
  verifySession(childId?: Uuid): Promise<VerifiedSession | null>;
  getEntitlement(childId: Uuid): Promise<EntitlementSnapshot>;
  registerDevice(installationId: Uuid, platform: "ios" | "android"): Promise<DeviceRegistration>;
  getProgress(childId: Uuid): Promise<RuntimeProgress>;
  commitActivityCompletion(request: CompletionCommitRequest): Promise<CompletionCommitResponse>;
}

export interface ProgressReadRepository {
  getChildProgress(childId: Uuid): Promise<readonly { nodeKey: string; status: string }[]>;
}
