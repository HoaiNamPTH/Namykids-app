import { useRouter } from "expo-router";
import { NamyScene, SceneAction, SceneCard } from "../../src/ui/NamyScene";

export default function SessionRecoveryRoute() {
  const router = useRouter();
  return (
    <NamyScene stateCode="AUTH / S08" title="Khôi phục phiên an toàn" description="Phiên Web Auth được giữ trong SecureStore. Nếu lưu trữ an toàn không sẵn sàng, ứng dụng chỉ hiển thị đường khôi phục này và không dùng JSON fallback.">
      <SceneCard><SceneAction label="Tiếp tục vào Child World (dev UI)" onPress={() => router.replace("/child-world")} tone="leaf" /><SceneAction label="Xem khôi phục an toàn" onPress={() => router.push("/recovery")} tone="paper" /></SceneCard>
    </NamyScene>
  );
}
