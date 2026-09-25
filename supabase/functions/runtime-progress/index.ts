import {
  authenticateRuntimeRequest,
  databaseErrorResponse,
  isRuntimeContext,
  isUuid,
  readJson,
  runtimeError,
} from "../_shared/runtime-auth.ts";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return runtimeError(400, "invalid_request");
    const body = await readJson(request);
    if (!body || !isUuid(body.child_id)) return runtimeError(400, "invalid_child");

    const authenticated = await authenticateRuntimeRequest(request, body.child_id);
    if (!isRuntimeContext(authenticated)) return authenticated.response;

    const { data, error } = await authenticated.context.appAdmin.rpc("get_app_runtime_progress", {
      p_parent_user_id: authenticated.context.parentUserId,
      p_child_id: body.child_id,
    });
    if (error || !data) return databaseErrorResponse(error);
    return Response.json({ ok: true, ...data });
  },
};
