import { useRouter } from "expo-router";
import { NamyScene, SceneAction, SceneCard } from "../../src/ui/NamyScene";

export default function RestrictedRoute() {
  const router = useRouter();
  return (
    <NamyScene stateCode="S11" title="Chưa sẵn sàng ở lượt này" description="Con có thể chọn một hành trình đang mở. Không có giá, mua hàng hay lời mời mua trong khu vực của trẻ.">
      <SceneCard><SceneAction label="Về Child World" onPress={() => router.push("/child-world")} tone="leaf" /></SceneCard>
    </NamyScene>
  );
}
