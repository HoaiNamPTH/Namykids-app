import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

type RuntimeContext = {
  parentUserId: string;
  appAdmin: SupabaseClient;
};

type ContextResult = { context: RuntimeContext } | { response: Response };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function runtimeError(status: number, code: string): Response {
  return Response.json({ ok: false, code }, { status });
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

export async function authenticateRuntimeRequest(request: Request, childId?: string): Promise<ContextResult> {
  const token = bearerToken(request);
  if (!token) return { response: runtimeError(401, "missing_authorization") };

  const webUrl = Deno.env.get("WEB_SUPABASE_URL");
  const webPublishableKey = Deno.env.get("WEB_SUPABASE_PUBLISHABLE_KEY");
  const appUrl = Deno.env.get("APP_SUPABASE_URL");
  const appSecretKey = Deno.env.get("APP_SUPABASE_SECRET_KEY");
  if (!webUrl || !webPublishableKey || !appUrl || !appSecretKey) {
    return { response: runtimeError(500, "server_misconfigured") };
  }

  const webAuth = createClient(webUrl, webPublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await webAuth.auth.getUser(token);
  if (error || !data.user) return { response: runtimeError(401, "invalid_token") };

  const appAdmin = createClient(appUrl, appSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  if (childId) {
    const { data: bindingIsActive, error: bindingError } = await appAdmin.rpc(
      "app_has_active_identity_binding",
      { p_parent_user_id: data.user.id, p_child_id: childId },
    );
    if (bindingError) return { response: runtimeError(503, "runtime_unavailable") };
    if (bindingIsActive !== true) return { response: runtimeError(403, "child_binding_not_active") };
  }

  return { context: { parentUserId: data.user.id, appAdmin } };
}

export function isRuntimeContext(result: ContextResult): result is { context: RuntimeContext } {
  return "context" in result;
}

export function databaseErrorResponse(error: unknown): Response {
  const message = isRecord(error) && typeof error.message === "string" ? error.message : "";
  if (message.includes("APP_CHILD_BINDING_NOT_ACTIVE")) return runtimeError(403, "child_binding_not_active");
  if (message.includes("APP_FULL_ENTITLEMENT_REQUIRED")) return runtimeError(403, "full_entitlement_required");
  if (message.includes("APP_DEVICE_LIMIT_REACHED")) return runtimeError(409, "device_limit_reached");
  if (message.includes("APP_DEVICE_PLATFORM_INVALID")) return runtimeError(400, "invalid_device_platform");
  if (message.includes("APP_RELEASE_NODE_ENGINE_PIN_INVALID")) return runtimeError(409, "release_node_engine_pin_invalid");
  if (message.includes("APP_ATTEMPT_PIN_INVALID")) return runtimeError(409, "attempt_pin_invalid");
  if (message.includes("APP_ACTIVITY_SOURCE_INVALID")) return runtimeError(422, "invalid_activity_source");
  return runtimeError(503, "runtime_unavailable");
}

function bearerToken(request: Request): string | null {
  const match = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}
