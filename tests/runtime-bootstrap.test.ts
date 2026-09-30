import { describe, expect, it, vi } from "vitest";
import { availabilityForRuntime, bootstrapRuntime } from "../src/runtime/runtime-bootstrap";

const ids = { parent: "00000000-0000-0000-0000-0000000000a1", child: "00000000-0000-0000-0000-0000000000b1" };

describe("runtime bootstrap composition", () => {
  it("feeds the verified bootstrap child into session, entitlement, and progress reads", async () => {
    const gateway = {
      bootstrap: vi.fn(async () => ({ childId: ids.child, bindingStatus: "active" as const })),
      verifySession: vi.fn(async () => ({ parentUserId: ids.parent })),
      getEntitlement: vi.fn(async () => ({ entitlement: "LIMITED" as const, sourceRevision: null, effectiveAt: null, expiresAt: null, refreshedAt: null, stale: false })),
      getProgress: vi.fn(async () => ({ progress: [], resume: null })),
    };

    const model = await bootstrapRuntime(gateway);
    expect(gateway.verifySession).toHaveBeenCalledWith(ids.child);
    expect(gateway.getEntitlement).toHaveBeenCalledWith(ids.child);
    expect(gateway.getProgress).toHaveBeenCalledWith(ids.child);
    expect(model).toMatchObject({ parentUserId: ids.parent, childId: ids.child });
    expect(availabilityForRuntime(model)).toBe("restricted");
    expect(availabilityForRuntime({ entitlement: { ...model.entitlement, entitlement: "FULL" } })).toBe("available");
  });

  it("does not continue when the binding cannot be verified", async () => {
    await expect(bootstrapRuntime({
      bootstrap: async () => ({ childId: ids.child, bindingStatus: "active" }),
      verifySession: async () => null,
      getEntitlement: async () => { throw new Error("must not read"); },
      getProgress: async () => { throw new Error("must not read"); },
    })).rejects.toThrow("runtime_binding_not_verified");
  });
});
