import { describe, expect, it, vi } from "vitest";
import { AppRuntimeClient, RuntimeRequestError } from "../src/data/app-runtime-client";

const ids = {
  child: "00000000-0000-0000-0000-000000000001",
  completion: "00000000-0000-0000-0000-000000000002",
  release: "00000000-0000-0000-0000-000000000003",
  node: "00000000-0000-0000-0000-000000000004"
};

describe("AppRuntimeClient", () => {
  it("uses the entitlement endpoint and preserves a fail-closed LIMITED response", async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      ok: true,
      entitlement: "LIMITED",
      source_revision: null,
      effective_at: null,
      expires_at: null,
      refreshed_at: null,
      stale: true
    }));
    const client = new AppRuntimeClient("https://app.example/functions/v1", "https://app.example/verify", async () => "web-token", fetcher as typeof fetch);

    await expect(client.getEntitlement(ids.child)).resolves.toMatchObject({ entitlement: "LIMITED", stale: true });
    expect(fetcher).toHaveBeenCalledWith(
      "https://app.example/functions/v1/runtime-entitlement",
      expect.objectContaining({ body: JSON.stringify({ child_id: ids.child }) })
    );
  });

  it("converts completion fields to the public runtime contract and strips parent identity", async () => {
    let requestBody = "";
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = String(init?.body ?? "");
      return jsonResponse({
        ok: true,
        attempt_id: ids.node,
        result_id: ids.release,
        completion_id: ids.completion,
        idempotent: false
      });
    });
    const client = new AppRuntimeClient("https://app.example/functions/v1", "https://app.example/verify", async () => "web-token", fetcher as typeof fetch);

    await client.commitActivityCompletion({
      childId: ids.child,
      completionId: ids.completion,
      releaseId: ids.release,
      nodeVersionId: ids.node,
      attemptId: null,
      startedAt: "2026-09-25T00:00:00.000Z",
      source: "offline",
      beginSnapshot: {},
      outcome: "completed",
      score: null,
      assisted: false,
      completedAt: "2026-09-25T00:01:00.000Z",
      resultPayload: {},
      progressStatus: "completed",
      resumePayload: null,
      requiresFull: false,
      parentUserId: "untrusted-parent" as never
    } as never);

    expect(JSON.parse(requestBody)).toMatchObject({
      child_id: ids.child,
      completion_id: ids.completion,
      release_id: ids.release,
      node_version_id: ids.node,
      requires_full: false
    });
    expect(requestBody).not.toContain("parent");
  });

  it("surfaces protected 401 responses for the outbox re-auth path", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ ok: false, code: "invalid_token" }, 401));
    const client = new AppRuntimeClient("https://app.example/functions/v1", "https://app.example/verify", async () => "web-token", fetcher as typeof fetch);

    await expect(client.getProgress(ids.child)).rejects.toMatchObject<Partial<RuntimeRequestError>>({ status: 401, code: "invalid_token" });
  });
});

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}
