import { useRouter } from "expo-router";
import { Text } from "react-native";
import { useRuntimeBootstrap } from "../../../src/runtime/RuntimeBootstrapProvider";
import { DevAssetNotice, NamyScene, SceneAction, SceneCard } from "../../../src/ui/NamyScene";

export default function SubjectRoute() {
  const router = useRouter();
  const runtime = useRuntimeBootstrap();
  if (runtime.status !== "ready") return <NamyScene stateCode="S08" title="Hành trình chưa sẵn sàng" description="Cần bootstrap child binding và progress projection đã xác minh."><SceneCard><SceneAction label="Khôi phục an toàn" onPress={() => router.push("/recovery")} tone="leaf" /></SceneCard></NamyScene>;
  const alphabetProgress = runtime.model.progress.progress.find((item) => item.nodeKey === "alphabet-missing-letters");
  const resume = runtime.model.progress.resume;
  const canResume = runtime.localResume || Boolean(resume);
  return (
    <NamyScene stateCode="S02" title="Chữ cái & vần" description="Đi theo một hành trình nhỏ để làm quen với thứ tự chữ cái.">
      <SceneCard><DevAssetNotice compact /><SceneAction label={canResume ? "Tiếp tục lượt đã lưu" : "Bắt đầu lượt Missing Letters"} onPress={() => router.push("/activity/alphabet-missing-letters")} tone="leaf" /><SceneAction label="Quay về Child World" onPress={() => router.push("/child-world")} tone="paper" /></SceneCard>
      <SceneCard><Text>{alphabetProgress ? `Trạng thái đã xác minh: ${alphabetProgress.status}` : "Chưa có tiến độ đã xác minh."}</Text><Text>{canResume ? "Có lượt local/runtime đã lưu để tiếp tục với nguyên content pin." : "Chưa có lượt cần tiếp tục."}</Text><Text>{runtime.outbox.status === "unavailable" ? "Kho lưu đồng bộ đang cần khôi phục." : `${runtime.outbox.pendingCount} lượt đang chờ đồng bộ.`}</Text><SceneAction label="Ngoại tuyến / đồng bộ an toàn" onPress={() => router.push("/recovery")} tone="paper" /></SceneCard>
    </NamyScene>
  );
}
