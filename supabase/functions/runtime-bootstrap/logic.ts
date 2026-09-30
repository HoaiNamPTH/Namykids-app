export type BootstrapChild = { id: string; parent_user_id: string };
export const bootstrapChildColumns = "id,parent_user_id" as const;

export type BootstrapDependencies<Context> = {
  authenticate(request: Request): Promise<{ context: Context } | { response: Response }>;
  parentUserId(context: Context): string;
  loadChildren(context: Context): Promise<{ data: readonly BootstrapChild[] | null; error: unknown }>;
  upsertBinding(context: Context, parentUserId: string, childId: string): Promise<{ data: unknown; error: unknown }>;
  databaseError(error: unknown): Response;
};

export async function handleRuntimeBootstrap<Context>(request: Request, dependencies: BootstrapDependencies<Context>): Promise<Response> {
  if (request.method !== "POST") return errorResponse(400, "invalid_request");
  const body = await readOptionalJson(request);
  if (body === null || Object.keys(body).length > 0) return errorResponse(400, "invalid_request");

  const authenticated = await dependencies.authenticate(request);
  if ("response" in authenticated) return authenticated.response;
  const parentUserId = dependencies.parentUserId(authenticated.context);
  const childrenResult = await dependencies.loadChildren(authenticated.context);
  if (childrenResult.error) return errorResponse(503, "child_source_unavailable");
  const children = childrenResult.data ?? [];
  if (children.length === 0) return errorResponse(409, "child_profile_required");
  if (children.length !== 1) return errorResponse(409, "child_profile_conflict");
  const child = children[0];
  if (!child || child.parent_user_id !== parentUserId) return errorResponse(503, "child_source_unavailable");

  const binding = await dependencies.upsertBinding(authenticated.context, parentUserId, child.id);
  if (binding.error || !binding.data) {
    const message = errorMessage(binding.error);
    if (message.includes("APP_PARENT_BINDING_CONFLICT") || message.includes("APP_CHILD_BINDING_CONFLICT")) {
      return errorResponse(409, "child_profile_conflict");
    }
    return dependencies.databaseError(binding.error);
  }
  return Response.json({ ok: true, child_id: child.id, binding_status: "active" });
}

async function readOptionalJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) return {};
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  return error !== null && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : "";
}

function errorResponse(status: number, code: string): Response {
  return Response.json({ ok: false, code }, { status });
}
