import { describe, expect, it, vi } from "vitest";
import { bootstrapChildColumns, handleRuntimeBootstrap, type BootstrapDependencies } from "../supabase/functions/runtime-bootstrap/logic";

type Context = { parentUserId: string };
const parentUserId = "00000000-0000-0000-0000-0000000000a1";
const childId = "00000000-0000-0000-0000-0000000000b1";

describe("runtime-bootstrap edge handler", () => {
  it("returns 401 when authorization is missing or invalid", async () => {
    const missing = dependencies({ authResponse: response(401, "missing_authorization") });
    await expect(call(missing)).resolves.toMatchObject({ status: 401 });
    const invalid = dependencies({ authResponse: response(401, "invalid_token") });
    await expect(call(invalid, "bad-token")).resolves.toMatchObject({ status: 401 });
  });

  it("maps zero and multiple Web RLS child rows to stable conflicts", async () => {
    await expect(json(await call(dependencies({ children: [] }), "token"))).resolves.toMatchObject({ code: "child_profile_required" });
    await expect(json(await call(dependencies({ children: [child(), child("00000000-0000-0000-0000-0000000000b2")] }), "token"))).resolves.toMatchObject({ code: "child_profile_conflict" });
  });

  it("binds exactly one child using only the verified parent identity", async () => {
    const upsert = vi.fn(async () => ({ data: { child_id: childId, status: "active" }, error: null }));
    const result = await call(dependencies({ children: [child()], upsert }), "token");
    await expect(json(result)).resolves.toEqual({ ok: true, child_id: childId, binding_status: "active" });
    expect(upsert).toHaveBeenCalledWith({ parentUserId }, parentUserId, childId);
  });

  it("rejects client-supplied semantic identity before provisioning", async () => {
    const authenticate = vi.fn(async () => ({ context: { parentUserId } }));
    const deps = dependencies({ authenticate });
    const result = await handleRuntimeBootstrap(new Request("http://local/runtime-bootstrap", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer token" },
      body: JSON.stringify({ parent_user_id: "fake", child_id: "fake" }),
    }), deps);
    expect(result.status).toBe(400);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("fails closed when the Web child source is unavailable or ownership mismatches", async () => {
    await expect(json(await call(dependencies({ childSourceError: new Error("offline") }), "token"))).resolves.toMatchObject({ code: "child_source_unavailable" });
    await expect(json(await call(dependencies({ children: [{ id: childId, parent_user_id: "00000000-0000-0000-0000-0000000000ff" }] }), "token"))).resolves.toMatchObject({ code: "child_source_unavailable" });
  });

  it("maps binding conflicts without leaking database diagnostics", async () => {
    const result = await call(dependencies({ children: [child()], bindingError: new Error("APP_PARENT_BINDING_CONFLICT details") }), "token");
    expect(result.status).toBe(409);
    await expect(json(result)).resolves.toEqual({ ok: false, code: "child_profile_conflict" });
  });

  it("queries only canonical child ownership fields", () => {
    expect(bootstrapChildColumns).toBe("id,parent_user_id");
    expect(bootstrapChildColumns).not.toMatch(/nickname|email|phone/);
  });
});

function child(id = childId) {
  return { id, parent_user_id: parentUserId };
}

function dependencies(options: {
  authResponse?: Response;
  authenticate?: BootstrapDependencies<Context>["authenticate"];
  children?: readonly ReturnType<typeof child>[];
  childSourceError?: unknown;
  bindingError?: unknown;
  upsert?: BootstrapDependencies<Context>["upsertBinding"];
} = {}): BootstrapDependencies<Context> {
  return {
    authenticate: options.authenticate ?? (async () => options.authResponse ? { response: options.authResponse } : { context: { parentUserId } }),
    parentUserId: (context) => context.parentUserId,
    loadChildren: async () => ({ data: options.children ?? [child()], error: options.childSourceError ?? null }),
    upsertBinding: options.upsert ?? (async () => ({ data: options.bindingError ? null : { status: "active" }, error: options.bindingError ?? null })),
    databaseError: () => response(503, "runtime_unavailable"),
  };
}

function call(deps: BootstrapDependencies<Context>, token?: string): Promise<Response> {
  return handleRuntimeBootstrap(new Request("http://local/runtime-bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: "{}",
  }), deps);
}

function response(status: number, code: string): Response {
  return Response.json({ ok: false, code }, { status });
}

async function json(result: Response): Promise<Record<string, unknown>> {
  return await result.json() as Record<string, unknown>;
}
