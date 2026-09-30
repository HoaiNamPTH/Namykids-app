import { useRouter } from "expo-router";
import { availabilityForRuntime } from "../../src/runtime/runtime-bootstrap";
import { useRuntimeBootstrap } from "../../src/runtime/RuntimeBootstrapProvider";
import { DevAssetNotice, NamyScene, SceneAction, SceneCard } from "../../src/ui/NamyScene";

export default function ChildWorldRoute() {
  const router = useRouter();
  const runtime = useRuntimeBootstrap();
  if (runtime.status !== "ready") return <NamyScene stateCode="S08 / S11" title="Đang kiểm tra hành trình an toàn" description="Nội dung chỉ mở sau khi phiên và child binding đã được xác minh."><SceneCard><SceneAction label="Thử lại" onPress={() => void runtime.reload()} tone="leaf" /><SceneAction label="Khôi phục an toàn" onPress={() => router.push("/recovery")} tone="paper" /></SceneCard></NamyScene>;
  const available = availabilityForRuntime(runtime.model) === "available";
  return (
    <NamyScene stateCode="S01" title="Chào con đến với NamyKids" description="Chọn một hành trình học hôm nay. Mọi nội dung chỉ hiển thị khi an toàn cho phiên hiện tại.">
      <SceneCard><SceneAction label="Chữ cái & vần" onPress={() => router.push(available ? "/subject/alphabet" : "/restricted")} tone="leaf" accessibilityHint="Mở hành trình Alphabet Missing Letters khi entitlement an toàn" /><SceneAction label="Góc của ba mẹ" onPress={() => router.push("/parent")} tone="paper" /></SceneCard>
      <SceneCard><DevAssetNotice /><SceneAction label={available ? "Nội dung hiện sẵn sàng" : "Nội dung chưa sẵn sàng"} onPress={() => router.push(available ? "/subject/alphabet" : "/restricted")} tone="paper" /></SceneCard>
    </NamyScene>
  );
}
