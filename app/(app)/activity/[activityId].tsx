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
  | { status: "restricted" }
  | { status: "recovery" };

export default function ActivityRoute() {
  const runtime = useRuntimeBootstrap();
  const router = useRouter();
  const sessions = useMemo(() => new JsonSessionSnapshotRepository(secureDeviceStore), []);
  const [activity, setActivity] = useState<ActivityRuntimeState>({ status: "loading" });

  useEffect(() => {
    if (runtime.status !== "ready") return;
    if (availabilityForRuntime(runtime.model) === "restricted") {
      setActivity({ status: "restricted" });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const stored = await sessions.loadActive(runtime.model.parentUserId, runtime.model.childId, "alphabet-missing-letters");
        if (stored) {
          const restored = restorePinnedActivitySession(stored, runtime.model.parentUserId, runtime.model.childId);
          if (!restored) throw new Error("invalid_session_snapshot");
          if (!cancelled) setActivity({ status: "ready", config: restored.activityState.config, pin: restored.pin, snapshot: restored });
          return;
        }
        const contentPin = await runtime.runtime.getPublishedContentPin(runtime.model.childId, "alphabet-missing-letters");
        const content = alphabetMissingLettersConfigSchema.safeParse(contentPin.payload);
        if (!content.success) throw new Error("invalid_published_content");
        if (!cancelled) setActivity({
          status: "ready",
          config: content.data,
          pin: createSessionPin(runtime.model.childId, content.data, contentPin),
          snapshot: null,
        });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof RuntimeRequestError && error.code === "content_not_published") setActivity({ status: "restricted" });
        else setActivity({ status: "recovery" });
      }
    })();
    return () => { cancelled = true; };
  }, [runtime, sessions]);

  if (runtime.status !== "ready" || activity.status === "loading") {
    return <NamyScene stateCode="S08" title="Đang chuẩn bị lượt chơi" description="NamyKids đang khôi phục đúng child binding và content pin trước khi bắt đầu." />;
  }
  if (availabilityForRuntime(runtime.model) === "restricted") {
    return <NamyScene stateCode="S11" title="Lượt chơi chưa sẵn sàng" description="Entitlement hiện ở trạng thái LIMITED hoặc stale nên ứng dụng không bắt đầu lượt mới."><SceneCard><SceneAction label="Về Child World" onPress={() => router.replace("/child-world")} tone="leaf" /></SceneCard></NamyScene>;
  }
  if (activity.status === "restricted") {
    return <NamyScene stateCode="S11" title="Nội dung chưa được phát hành" description="Không có published content pin hợp lệ nên lượt canonical không được bắt đầu."><SceneCard><SceneAction label="Về Child World" onPress={() => router.replace("/child-world")} tone="leaf" /></SceneCard></NamyScene>;
  }
  if (activity.status === "recovery") {
    return <NamyScene stateCode="S12" title="Lượt chơi cần khôi phục an toàn" description="Content pin hoặc session snapshot không hợp lệ; ứng dụng không tự đổi release giữa lượt."><SceneCard><SceneAction label="Mở khôi phục an toàn" onPress={() => router.replace("/recovery")} tone="leaf" /></SceneCard></NamyScene>;
  }
  return <ActivityPlayer parentUserId={runtime.model.parentUserId} runtime={runtime.runtime} refreshWebSession={runtime.refreshWebSession} config={activity.config} pin={activity.pin} initialSnapshot={activity.snapshot} />;
}
