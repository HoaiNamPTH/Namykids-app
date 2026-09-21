import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type VerifyResponse =
  | { ok: true; parent_user_id: string }
  | {
      ok: false;
      code:
        | "missing_authorization"
        | "invalid_token"
        | "invalid_child"
        | "child_binding_not_active"
        | "server_misconfigured";
    };

function unauthorized(
  code: Extract<VerifyResponse, { ok: false }>["code"],
): Response {
  return Response.json({ ok: false, code } satisfies VerifyResponse, {
    status: 401,
  });
}

function forbidden(): Response {
  return Response.json(
    { ok: false, code: "child_binding_not_active" } satisfies VerifyResponse,
    {
      status: 403,
    },
  );
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function requestedChildId(
  request: Request,
): Promise<string | null | "invalid"> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return null;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("child_id" in body)) return null;
    return typeof body.child_id === "string" ? body.child_id : "invalid";
  } catch {
    return "invalid";
  }
}

export default {
  // verify_jwt is disabled in config because this is a Web-project token, not App Auth.
  async fetch(request: Request): Promise<Response> {
    const token = bearerToken(request);
    if (!token) return unauthorized("missing_authorization");

    const webUrl = Deno.env.get("WEB_SUPABASE_URL");
    const webPublishableKey = Deno.env.get("WEB_SUPABASE_PUBLISHABLE_KEY");
    if (!webUrl || !webPublishableKey)
      return unauthorized("server_misconfigured");

    const webAuth = createClient(webUrl, webPublishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await webAuth.auth.getUser(token);
    if (error || !data.user) return unauthorized("invalid_token");

    const childId = await requestedChildId(request);
    if (childId === "invalid") return unauthorized("invalid_child");
    if (childId) {
      const appUrl = Deno.env.get("APP_SUPABASE_URL");
      const appSecretKey = Deno.env.get("APP_SUPABASE_SECRET_KEY");
      if (!appUrl || !appSecretKey) return unauthorized("server_misconfigured");

      const appAdmin = createClient(appUrl, appSecretKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
      const { data: bindingIsActive, error: bindingError } = await appAdmin.rpc(
        "app_has_active_identity_binding",
        { p_parent_user_id: data.user.id, p_child_id: childId },
      );
      if (bindingError || bindingIsActive !== true) return forbidden();
    }

    // The response deliberately ignores every client-supplied parent_user_id.
    return Response.json({
      ok: true,
      parent_user_id: data.user.id,
    } satisfies VerifyResponse);
  },
};
