import type { CompletionCommitRequest } from "../domain/types";
import type {
  CompletionCommitResponse,
  DeviceRegistration,
  EntitlementSnapshot,
  RuntimeDataGateway,
  RuntimeProgress,
  VerifiedSession
} from "./contracts";

type TokenSource = () => Promise<string | null>;
type Fetcher = typeof fetch;

export class RuntimeRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string
  ) {
    super(code);
  }
}

export class AppRuntimeClient implements RuntimeDataGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly verifyWebSessionUrl: string,
    private readonly token: TokenSource,
    private readonly fetcher: Fetcher = fetch
  ) {}

  async verifySession(childId?: string): Promise<VerifiedSession | null> {
    const token = await this.token();
    if (!token) return null;
    const response = await this.fetcher(this.verifyWebSessionUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(childId ? { child_id: childId } : {})
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error("runtime_session_verification_failed");
    const body = (await response.json()) as { ok: boolean; parent_user_id?: string };
    return body.ok && body.parent_user_id ? { parentUserId: body.parent_user_id } : null;
  }

  async getEntitlement(childId: string): Promise<EntitlementSnapshot> {
    const body = await this.request<EntitlementResponse>("runtime-entitlement", { child_id: childId });
    return {
      entitlement: body.entitlement,
      sourceRevision: body.source_revision,
      effectiveAt: body.effective_at,
      expiresAt: body.expires_at,
      refreshedAt: body.refreshed_at,
      stale: body.stale
    };
  }

  async registerDevice(installationId: string, platform: "ios" | "android"): Promise<DeviceRegistration> {
    const body = await this.request<DeviceResponse>("runtime-device", {
      installation_id: installationId,
      platform
    });
    return {
      installationId: body.installation_id,
      status: body.status,
      activeDeviceCount: body.active_device_count
    };
  }

  async getProgress(childId: string): Promise<RuntimeProgress> {
    const body = await this.request<ProgressResponse>("runtime-progress", { child_id: childId });
    return {
      progress: body.progress.map((item) => ({
        nodeKey: item.node_key,
        releaseId: item.release_id,
        status: item.status,
        lastResultId: item.last_result_id,
        updatedAt: item.updated_at
      })),
      resume: body.resume && {
        releaseId: body.resume.release_id,
        nodeVersionId: body.resume.node_version_id,
        engineCode: body.resume.engine_code,
        engineVersion: body.resume.engine_version,
        resumePayload: body.resume.resume_payload,
        updatedAt: body.resume.updated_at
      }
    };
  }

  async commitActivityCompletion(request: CompletionCommitRequest): Promise<CompletionCommitResponse> {
    // Defense in depth for callers compiled against an older request shape.
    const { parentUserId: _untrustedParent, parent_user_id: _legacyParent, ...clientRequest } = request as CompletionCommitRequest & {
      parentUserId?: unknown;
      parent_user_id?: unknown;
    };
    void _untrustedParent;
    void _legacyParent;
    const body = await this.request<CompletionResponse>("runtime-completion", {
      child_id: clientRequest.childId,
      completion_id: clientRequest.completionId,
      release_id: clientRequest.releaseId,
      node_version_id: clientRequest.nodeVersionId,
      attempt_id: clientRequest.attemptId,
      started_at: clientRequest.startedAt,
      source: clientRequest.source,
      begin_snapshot: clientRequest.beginSnapshot,
      outcome: clientRequest.outcome,
      score: clientRequest.score,
      assisted: clientRequest.assisted,
      completed_at: clientRequest.completedAt,
      result_payload: clientRequest.resultPayload,
      progress_status: clientRequest.progressStatus,
      resume_payload: clientRequest.resumePayload,
      requires_full: clientRequest.requiresFull
    });
    return {
      attemptId: body.attempt_id,
      resultId: body.result_id,
      completionId: body.completion_id,
      idempotent: body.idempotent
    };
  }

  private async request<T>(path: string, body: object): Promise<T> {
    const token = await this.token();
    if (!token) throw new Error("runtime_auth_required");
    const response = await this.fetcher(this.endpoint(path), {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw await runtimeError(response);
    return (await response.json()) as T;
  }

  private endpoint(path: string): string {
    return `${this.baseUrl.replace(/\/$/, "")}/${path}`;
  }
}

type EntitlementResponse = {
  ok: true;
  entitlement: EntitlementSnapshot["entitlement"];
  source_revision: string | null;
  effective_at: string | null;
  expires_at: string | null;
  refreshed_at: string | null;
  stale: boolean;
};

type DeviceResponse = {
  ok: true;
  installation_id: string;
  status: "active";
  active_device_count: number;
};

type ProgressResponse = {
  ok: true;
  progress: {
    node_key: string;
    release_id: string;
    status: string;
    last_result_id: string | null;
    updated_at: string;
  }[];
  resume: {
    release_id: string;
    node_version_id: string;
    engine_code: "E01" | "E02" | "E04";
    engine_version: string;
    resume_payload: Record<string, unknown>;
    updated_at: string;
  } | null;
};

type CompletionResponse = {
  ok: true;
  attempt_id: string;
  result_id: string;
  completion_id: string;
  idempotent: boolean;
};

async function runtimeError(response: Response): Promise<RuntimeRequestError> {
  let code = "runtime_request_failed";
  try {
    const body = (await response.json()) as { code?: unknown };
    if (typeof body.code === "string") code = body.code;
  } catch {
    // The trusted boundary intentionally does not expose backend diagnostics.
  }
  return new RuntimeRequestError(response.status, code);
}
