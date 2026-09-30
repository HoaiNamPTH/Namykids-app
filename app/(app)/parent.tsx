import { useRouter } from "expo-router";
import { Text } from "react-native";
import { useRuntimeBootstrap } from "../../src/runtime/RuntimeBootstrapProvider";
import { NamyScene, SceneAction, SceneCard } from "../../src/ui/NamyScene";

export default function ParentRoute() {
  const router = useRouter();
  const runtime = useRuntimeBootstrap();
  if (runtime.status !== "ready") return <NamyScene calm stateCode="S10 / S08" eyebrow="NamyKids / Parent" title="Tiến độ đang được khôi phục" description="Chỉ hiển thị progress projection khi phiên an toàn sẵn sàng."><SceneCard><SceneAction label="Thử lại" onPress={() => void runtime.reload()} tone="leaf" /></SceneCard></NamyScene>;
  return (
    <NamyScene calm stateCode="S10" eyebrow="NamyKids / Parent" title="Góc của ba mẹ" description="Thông tin học tập chỉ đọc, dựa trên progress projection đã xác minh.">
      <SceneCard><Text>{runtime.model.progress.progress.length === 0 ? "Chưa có tiến độ đã xác minh." : `${runtime.model.progress.progress.length} mục có trạng thái đã xác minh.`}</Text><Text>{runtime.model.progress.resume || runtime.localResume ? "Có một lượt có thể tiếp tục." : "Không có lượt đang chờ tiếp tục."}</Text><Text>{runtime.outbox.status === "unavailable" ? "Kho đồng bộ cục bộ đang cần khôi phục." : `${runtime.outbox.pendingCount} lượt đang chờ đồng bộ.`}</Text><SceneAction label="Quay lại Child World" onPress={() => router.push("/child-world")} tone="leaf" /></SceneCard>
      <SceneCard><SceneAction label="Không có phần trăm giả lập" onPress={() => {}} tone="paper" disabled /></SceneCard>
    </NamyScene>
  );
}
