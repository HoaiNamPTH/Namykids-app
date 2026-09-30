import { useRouter } from "expo-router";
import { useRuntimeBootstrap } from "../../src/runtime/RuntimeBootstrapProvider";
import { DevAssetNotice, NamyScene, SceneAction, SceneCard } from "../../src/ui/NamyScene";

export default function ChildWorldRoute() {
  const router = useRouter();
  const runtime = useRuntimeBootstrap();
  if (runtime.status !== "ready") return <NamyScene stateCode="S08" title="Đang kiểm tra hành trình an toàn" description="Nội dung chỉ mở sau khi phiên và child binding đã được xác minh."><SceneCard><SceneAction label="Thử lại" onPress={() => void runtime.reload()} tone="leaf" /><SceneAction label="Khôi phục an toàn" onPress={() => router.push("/recovery")} tone="paper" /></SceneCard></NamyScene>;
  return (
    <NamyScene stateCode="S01" title="Chào con đến với NamyKids" description="Chọn một hành trình học hôm nay. Mọi nội dung chỉ hiển thị khi an toàn cho phiên hiện tại.">
      <SceneCard><SceneAction label="Chữ cái & vần" onPress={() => router.push("/subject/alphabet")} tone="leaf" accessibilityHint="Mở hành trình Alphabet; entitlement được kiểm tra theo content pin khi bắt đầu lượt" /><SceneAction label="Góc của ba mẹ" onPress={() => router.push("/parent")} tone="paper" /></SceneCard>
      <SceneCard><DevAssetNotice /><SceneAction label="Xem hành trình" onPress={() => router.push("/subject/alphabet")} tone="paper" /></SceneCard>
    </NamyScene>
  );
}
