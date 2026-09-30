import {
  authenticateRuntimeRequest,
  databaseErrorResponse,
  isRecord,
  isRuntimeContext,
  isUuid,
  readJson,
  runtimeError,
} from "../_shared/runtime-auth.ts";

const firstSliceNodeKey = "alphabet-missing-letters";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return runtimeError(400, "invalid_request");
    const body = await readJson(request);
    if (!body || body.node_key !== firstSliceNodeKey || !isUuid(body.child_id)) return runtimeError(400, "unsupported_node");
    const authenticated = await authenticateRuntimeRequest(request, body.child_id);
    if (!isRuntimeContext(authenticated)) return authenticated.response;

    const { data, error } = await authenticated.context.appAdmin.rpc("get_app_published_content_pin", {
      p_node_key: firstSliceNodeKey,
    });
    if (error || !data || !isRecord(data)) return contentPinError(error);
    return Response.json({ ok: true, ...data });
  },
};

function contentPinError(error: unknown): Response {
  const message = error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "";
  if (message.includes("APP_CONTENT_NOT_PUBLISHED")) return runtimeError(409, "content_not_published");
  if (message.includes("APP_CONTENT_PIN_CONFLICT")) return runtimeError(409, "content_pin_conflict");
  return databaseErrorResponse(error);
}
