import {
  authenticateRuntimeRequest,
  databaseErrorResponse,
  isRecord,
  isRuntimeContext,
  isUuid,
  readJson,
  runtimeError,
} from "../_shared/runtime-auth.ts";

const requiredStrings = [
  "child_id",
  "completion_id",
  "release_id",
  "node_version_id",
  "started_at",
  "source",
  "outcome",
  "completed_at",
  "progress_status",
] as const;

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return runtimeError(400, "invalid_request");
    const body = await readJson(request);
    if (!validCompletionRequest(body)) return runtimeError(400, "invalid_request");
    if ("parent_user_id" in body || "parentUserId" in body) return runtimeError(400, "invalid_request");

    const authenticated = await authenticateRuntimeRequest(request, body.child_id);
    if (!isRuntimeContext(authenticated)) return authenticated.response;

    const { data, error } = await authenticated.context.appAdmin.rpc("commit_activity_completion", {
      p_parent_user_id: authenticated.context.parentUserId,
      p_child_id: body.child_id,
      p_completion_id: body.completion_id,
      p_release_id: body.release_id,
      p_node_version_id: body.node_version_id,
      p_attempt_id: body.attempt_id,
      p_started_at: body.started_at,
      p_source: body.source,
      p_begin_snapshot: body.begin_snapshot,
      p_outcome: body.outcome,
      p_score: body.score,
      p_assisted: body.assisted,
      p_completed_at: body.completed_at,
      p_result_payload: body.result_payload,
      p_progress_status: body.progress_status,
      p_resume_payload: body.resume_payload,
      p_requires_full: body.requires_full,
    });
    if (error || !data || !isRecord(data)) return databaseErrorResponse(error);
    return Response.json({ ok: true, ...data });
  },
};

function validCompletionRequest(body: Record<string, unknown> | null): body is Record<string, unknown> & {
  child_id: string;
  completion_id: string;
  release_id: string;
  node_version_id: string;
  attempt_id: string | null;
  started_at: string;
  source: "online" | "offline";
  begin_snapshot: Record<string, unknown>;
  outcome: string;
  score: number | null;
  assisted: boolean;
  completed_at: string;
  result_payload: Record<string, unknown>;
  progress_status: string;
  resume_payload: Record<string, unknown> | null;
  requires_full: boolean;
} {
  if (!body || requiredStrings.some((key) => typeof body[key] !== "string")) return false;
  if (![body.child_id, body.completion_id, body.release_id, body.node_version_id].every(isUuid)) return false;
  return (
    (body.attempt_id === null || isUuid(body.attempt_id)) &&
    (body.source === "online" || body.source === "offline") &&
    isRecord(body.begin_snapshot) &&
    (body.score === null || typeof body.score === "number") &&
    typeof body.assisted === "boolean" &&
    isRecord(body.result_payload) &&
    (body.resume_payload === null || isRecord(body.resume_payload)) &&
    typeof body.requires_full === "boolean"
  );
}
