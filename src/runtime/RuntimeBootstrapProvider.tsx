import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AppRuntimeClient } from "../data/app-runtime-client";
import { readRuntimeConfig } from "../auth/runtime-config";
import { createWebAuthSessionGateway } from "../auth/web-auth-session";
import { bootstrapRuntime, type RuntimeReadModel } from "./runtime-bootstrap";
import { JsonPendingCompletionRepository, JsonSessionSnapshotRepository } from "../persistence/contracts";
import { secureDeviceStore } from "../persistence/secure-device-store";
import { reconcilePendingCompletions, type OutboxReconciliationResult, type WebSessionRefresh } from "../sync/outbox-reconciliation";

type OutboxState = {
  status: "ready" | "unavailable";
  pendingCount: number;
  results: readonly OutboxReconciliationResult[];
};

export type RuntimeBootstrapState =
  | { status: "loading" }
  | { status: "ready"; model: RuntimeReadModel; runtime: AppRuntimeClient; refreshWebSession: WebSessionRefresh; localResume: boolean; outbox: OutboxState }
  | { status: "restricted"; code: "child_profile_required" | "child_profile_conflict" | "runtime_binding_not_verified" }
  | { status: "recovery"; code: "runtime_not_configured" | "runtime_unavailable" | "auth_secure_storage_unavailable" };

type RuntimeBootstrapContextValue = RuntimeBootstrapState & { reload: () => Promise<void> };

const RuntimeBootstrapContext = createContext<RuntimeBootstrapContextValue | null>(null);

export function RuntimeBootstrapProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<RuntimeBootstrapState>({ status: "loading" });
  const reload = useCallback(async () => {
    try {
      const config = readRuntimeConfig(process.env);
      const session = createWebAuthSessionGateway(config);
      const recovery = await session.recoveryState();
      if (recovery) { setState({ status: "recovery", code: recovery.code }); return; }
      const runtime = new AppRuntimeClient(config.appRuntimeUrl, config.verifyWebSessionUrl, () => session.accessToken());
      const refreshWebSession = () => session.accessToken();
      let model = await bootstrapRuntime(runtime);
      let localResume = false;
      let outbox: OutboxState = { status: "ready", pendingCount: 0, results: [] };
      try {
        const sessions = new JsonSessionSnapshotRepository(secureDeviceStore);
        const pendingRepository = new JsonPendingCompletionRepository(secureDeviceStore);
        const activeSession = await sessions.loadActive(model.parentUserId, model.childId, "alphabet-missing-letters");
        localResume = Boolean(activeSession);
        const pending = await pendingRepository.list(model.parentUserId, model.childId);
        const results = await reconcilePendingCompletions(pending, pendingRepository, runtime, refreshWebSession);
        const remaining = await pendingRepository.list(model.parentUserId, model.childId);
        if (activeSession?.state.completionId && results.some((result) => result.status === "committed" && result.completionId === activeSession.state.completionId)) {
          await sessions.clear(activeSession);
          localResume = false;
        }
        if (results.some((result) => result.status === "committed")) {
          model = { ...model, progress: await runtime.getProgress(model.childId) };
        }
        outbox = { status: "ready", pendingCount: remaining.length, results };
      } catch {
        outbox = { status: "unavailable", pendingCount: 0, results: [] };
      }
      setState({ status: "ready", model, runtime, refreshWebSession, localResume, outbox });
    } catch (error) {
      const code = error instanceof Error ? error.message : "runtime_unavailable";
      if (code === "child_profile_required" || code === "child_profile_conflict" || code === "runtime_binding_not_verified") {
        setState({ status: "restricted", code });
      } else if (code.startsWith("Missing public runtime configuration")) {
        setState({ status: "recovery", code: "runtime_not_configured" });
      } else {
        setState({ status: "recovery", code: "runtime_unavailable" });
      }
    }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  const value = useMemo(() => ({ ...state, reload }), [reload, state]);
  return <RuntimeBootstrapContext.Provider value={value}>{children}</RuntimeBootstrapContext.Provider>;
}

export function useRuntimeBootstrap(): RuntimeBootstrapContextValue {
  const context = useContext(RuntimeBootstrapContext);
  if (!context) throw new Error("runtime_bootstrap_provider_missing");
  return context;
}
