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
    if (!body || !isUuid(body.installation_id) || (body.platform !== "ios" && body.platform !== "android")) {
      return runtimeError(400, "invalid_request");
    }

    const authenticated = await authenticateRuntimeRequest(request);
    if (!isRuntimeContext(authenticated)) return authenticated.response;

    const { data, error } = await authenticated.context.appAdmin.rpc("register_app_device", {
      p_parent_user_id: authenticated.context.parentUserId,
      p_installation_id: body.installation_id,
      p_platform: body.platform,
    });
    if (error || !data) return databaseErrorResponse(error);
    return Response.json({ ok: true, ...data });
  },
};
