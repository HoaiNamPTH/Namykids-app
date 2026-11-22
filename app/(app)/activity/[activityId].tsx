import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { alphabetMissingLettersConfigSchema, type AlphabetMissingLettersConfig } from "../../../src/content/missing-letters/schema";
import { RuntimeRequestError } from "../../../src/data/app-runtime-client";
import type { SessionPin } from "../../../src/domain/types";
import { JsonSessionSnapshotRepository, type SessionSnapshot } from "../../../src/persistence/contracts";
import { secureDeviceStore } from "../../../src/persistence/secure-device-store";
import { ActivityPlayer } from "../../../src/runtime/activity-player/ActivityPlayer";
import { createSessionPin, restorePinnedActivitySession } from "../../../src/runtime/activity-player/session-snapshot";
import { useRuntimeBootstrap } from "../../../src/runtime/RuntimeBootstrapProvider";
import { availabilityForRuntime } from "../../../src/runtime/runtime-bootstrap";
import { LoadingScreen, RecoveryScreen, RestrictedScreen } from "../../../src/ui/FoundationScreens";

type ActivityRuntimeState =
  | { status: "loading" }
  | { status: "ready"; config: AlphabetMissingLettersConfig; pin: SessionPin; snapshot: SessionSnapshot | null }
  | { status: "restricted"; reason: "full_required" | "content_unavailable" }
  | { status: "recovery" };

export default function ActivityRoute() {
  const runtime = useRuntimeBootstrap();
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const sessions = useMemo(() => new JsonSessionSnapshotRepository(secureDeviceStore), []);
  const [activity, setActivity] = useState<ActivityRuntimeState>({ status: "loading" });

  useEffect(() => {
    if (runtime.status !== "ready") return;
    const targetActivity = activityId || "alphabet-missing-letters";
    if (targetActivity !== "alphabet-missing-letters") {
      setActivity({ status: "restricted", reason: "content_unavailable" });
      return;
    }

    let cancelled = false;
    const setReadyFromPinnedContent = (
      config: AlphabetMissingLettersConfig,
      pin: SessionPin,
      snapshot: SessionSnapshot | null,
    ) => {
      if (cancelled) return;
      if (availabilityForRuntime(runtime.model, config.requiresFull) === "restricted") {
        setActivity({ status: "restricted", reason: "full_required" });
        return;
      }
      setActivity({ status: "ready", config, pin, snapshot });
    };

    void (async () => {
      try {
        const stored = await sessions.loadActive(runtime.model.parentUserId, runtime.model.childId, targetActivity);
        if (stored) {
          const restored = restorePinnedActivitySession(stored, runtime.model.parentUserId, runtime.model.childId);
          if (!restored) throw new Error("invalid_session_snapshot");
          setReadyFromPinnedContent(restored.activityState.config, restored.pin, restored);
          return;
        }
        const contentPin = await runtime.runtime.getPublishedContentPin(runtime.model.childId, targetActivity);
        const content = alphabetMissingLettersConfigSchema.safeParse(contentPin.payload);
        if (!content.success) {
          if (!cancelled) setActivity({ status: "restricted", reason: "content_unavailable" });
          return;
        }
        setReadyFromPinnedContent(content.data, createSessionPin(runtime.model.childId, content.data, contentPin), null);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof RuntimeRequestError && error.code === "content_not_published") {
          setActivity({ status: "restricted", reason: "content_unavailable" });
        } else {
          setActivity({ status: "recovery" });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [activityId, runtime, sessions]);

  if (runtime.status === "recovery") {
    return <RecoveryScreen onReload={() => void runtime.reload()} onHome={() => router.replace("/child-world")} />;
  }
  if (runtime.status === "restricted") {
    return <RestrictedScreen onHome={() => router.replace("/child-world")} />;
  }
  if (activity.status === "restricted") {
    return <RestrictedScreen onHome={() => router.replace("/child-world")} />;
  }
  if (activity.status === "recovery") {
    return <RecoveryScreen onReload={() => router.replace("/recovery")} onHome={() => router.replace("/child-world")} />;
  }
  if (runtime.status !== "ready" || activity.status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <ActivityPlayer
      parentUserId={runtime.model.parentUserId}
      runtime={runtime.runtime}
      refreshWebSession={runtime.refreshWebSession}
      config={activity.config}
      pin={activity.pin}
      initialSnapshot={activity.snapshot}
    />
  );
}
