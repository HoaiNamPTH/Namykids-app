import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { alphabetMissingLettersConfigSchema, type AlphabetMissingLettersConfig } from "../../../src/content/missing-letters/schema";
import { RuntimeRequestError } from "../../../src/data/app-runtime-client";
import type { SessionPin } from "../../../src/domain/types";
import { JsonSessionSnapshotRepository, type SessionSnapshot } from "../../../src/persistence/contracts";
import { secureDeviceStore } from "../../../src/persistence/secure-device-store";
import { ActivityPlayer } from "../../../src/runtime/activity-player/ActivityPlayer";
import { createSessionPin, restorePinnedActivitySession } from "../../../src/runtime/activity-player/session-snapshot";
import { useRuntimeBootstrap } from "../../../src/runtime/RuntimeBootstrapProvider";
import { availabilityForRuntime } from "../../../src/runtime/runtime-bootstrap";
import { NamyScene, SceneAction, SceneCard } from "../../../src/ui/NamyScene";

type ActivityRuntimeState =
  | { status: "loading" }
  | { status: "ready"; config: AlphabetMissingLettersConfig; pin: SessionPin; snapshot: SessionSnapshot | null }
  | { status: "restricted"; reason: "full_required" | "content_unavailable" }
  | { status: "recovery" };

export default function ActivityRoute() {
  const runtime = useRuntimeBootstrap();
  const router = useRouter();
  const sessions = useMemo(() => new JsonSessionSnapshotRepository(secureDeviceStore), []);
  const [activity, setActivity] = useState<ActivityRuntimeState>({ status: "loading" });

  useEffect(() => {
    if (runtime.status !== "ready") return;
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
        const stored = await sessions.loadActive(runtime.model.parentUserId, runtime.model.childId, "alphabet-missing-letters");
        if (stored) {
          const restored = restorePinnedActivitySession(stored, runtime.model.parentUserId, runtime.model.childId);
          if (!restored) throw new Error("invalid_session_snapshot");
          setReadyFromPinnedContent(restored.activityState.config, restored.pin, restored);
          return;
        }
        const contentPin = await runtime.runtime.getPublishedContentPin(runtime.model.childId, "alphabet-missing-letters");
        const content = alphabetMissingLettersConfigSchema.safeParse(contentPin.payload);
        if (!content.success) {
          if (!cancelled) setActivity({ status: "restricted", reason: "content_unavailable" });
          return;
        }
        setReadyFromPinnedContent(content.data, createSessionPin(runtime.model.childId, content.data, contentPin), null);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof RuntimeRequestError && error.code === "content_not_published") setActivity({ status: "restricted", reason: "content_unavailable" });
        else setActivity({ status: "recovery" });
      }
    })();
    return () => { cancelled = true; };
  }, [runtime, sessions]);

  if (runtime.status !== "ready" || activity.status === "loading") {
    return <NamyScene stateCode="S08" title="Đang chuẩn bị lượt chơi" description="NamyKids đang khôi phục đúng child binding và content pin trước khi bắt đầu." />;
  }
  if (activity.status === "restricted") {
    const fullRequired = activity.reason === "full_required";
    return <NamyScene stateCode="S11" title={fullRequired ? "Nội dung này cần quyền truy cập đầy đủ" : "Nội dung chưa được phát hành"} description={fullRequired ? "Content pin hiện tại yêu cầu FULL với entitlement snapshot còn usable." : "Không có published content pin hợp lệ nên lượt canonical không được bắt đầu."}><SceneCard><SceneAction label="Về Child World" onPress={() => router.replace("/child-world")} tone="leaf" /></SceneCard></NamyScene>;
  }
  if (activity.status === "recovery") {
    return <NamyScene stateCode="S12" title="Lượt chơi cần khôi phục an toàn" description="Content pin hoặc session snapshot không hợp lệ; ứng dụng không tự đổi release giữa lượt."><SceneCard><SceneAction label="Mở khôi phục an toàn" onPress={() => router.replace("/recovery")} tone="leaf" /></SceneCard></NamyScene>;
  }
  return <ActivityPlayer parentUserId={runtime.model.parentUserId} runtime={runtime.runtime} refreshWebSession={runtime.refreshWebSession} config={activity.config} pin={activity.pin} initialSnapshot={activity.snapshot} />;
}
