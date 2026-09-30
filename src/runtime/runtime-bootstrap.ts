import type {
  EntitlementSnapshot,
  RuntimeBootstrapGateway,
  RuntimeDataGateway,
  RuntimeProgress,
} from "../data/contracts";
import type { Uuid } from "../domain/types";

export type RuntimeReadModel = {
  parentUserId: Uuid;
  childId: Uuid;
  entitlement: EntitlementSnapshot;
  progress: RuntimeProgress;
};

type BootstrapGateway = Pick<RuntimeDataGateway, "verifySession" | "getEntitlement" | "getProgress"> & RuntimeBootstrapGateway;

/** Composes only server-verified identity and read models; it never accepts a UI-provided child ID. */
export async function bootstrapRuntime(gateway: BootstrapGateway): Promise<RuntimeReadModel> {
  const binding = await gateway.bootstrap();
  const verified = await gateway.verifySession(binding.childId);
  if (!verified) throw new Error("runtime_binding_not_verified");
  const [entitlement, progress] = await Promise.all([
    gateway.getEntitlement(binding.childId),
    gateway.getProgress(binding.childId),
  ]);
  return { parentUserId: verified.parentUserId, childId: binding.childId, entitlement, progress };
}

export function availabilityForRuntime(
  readModel: Pick<RuntimeReadModel, "entitlement">,
  requiresFull: boolean,
): "available" | "restricted" {
  if (!requiresFull) return "available";
  return readModel.entitlement.entitlement === "FULL" && readModel.entitlement.stale === false
    ? "available"
    : "restricted";
}
