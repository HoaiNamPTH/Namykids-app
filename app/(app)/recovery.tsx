import { useRouter } from "expo-router";
import { useRuntimeBootstrap } from "../../src/runtime/RuntimeBootstrapProvider";
import { NamyScene, SceneAction, SceneCard, SceneText } from "../../src/ui/NamyScene";

export default function RecoveryRoute() {
  const router = useRouter();
  const runtime = useRuntimeBootstrap();
  const detail = runtime.status === "ready"
    ? `${runtime.localResume ? "Có session snapshot đang giữ nguyên content pin. " : "Không có session snapshot đang hoạt động. "}${runtime.outbox.status === "ready" ? `${runtime.outbox.pendingCount} completion đang chờ đồng bộ.` : "Kho outbox cần khôi phục."}`
    : "Runtime chưa sẵn sàng để đọc trạng thái khôi phục.";
  return (
    <NamyScene stateCode="S08 / S09 / S12" title="Mình đang giữ mọi thứ an toàn" description="Nếu không có kết nối hoặc phiên cần khôi phục, lượt chơi sẽ không bị gửi lại bằng mã hoàn thành mới.">
      <SceneCard><SceneText>{detail}</SceneText>{runtime.status === "ready" ? <SceneAction label="Thử đồng bộ và tải lại" onPress={() => void runtime.reload()} tone="leaf" /> : null}<SceneAction label="Khôi phục Web Auth" onPress={() => router.push("/session-recovery")} tone="paper" /><SceneAction label="Về Child World" onPress={() => router.push("/child-world")} tone="paper" /></SceneCard>
    </NamyScene>
  );
}
