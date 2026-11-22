import { useRouter } from "expo-router";
import { useRuntimeBootstrap } from "../../src/runtime/RuntimeBootstrapProvider";
import { LoadingScreen, ParentZoneScreen, RecoveryScreen, RestrictedScreen } from "../../src/ui/FoundationScreens";

export default function ParentRoute() {
  const router = useRouter();
  const runtime = useRuntimeBootstrap();

  if (runtime.status === "recovery") {
    return <RecoveryScreen onReload={() => void runtime.reload()} onHome={() => router.replace("/child-world")} />;
  }
  if (runtime.status === "restricted") {
    return <RestrictedScreen onHome={() => router.replace("/child-world")} />;
  }
  if (runtime.status !== "ready") {
    return <LoadingScreen />;
  }

  const verified = runtime.model.progress.progress.length;
  const resumable = runtime.model.progress.resume || runtime.localResume ? 1 : 0;
  const pending = runtime.outbox.status === "ready" ? runtime.outbox.pendingCount : 0;
  const summary = [
    `Lượt chơi vừa hoàn thành: ${verified} hoạt động đã được ghi nhận.`,
    `• Lượt có thể tiếp tục: ${resumable}`,
    `• Lượt đang chờ đồng bộ: ${pending}`,
    `• Dữ liệu chưa xác minh: 0`,
  ];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/child-world");
    }
  };

  return <ParentZoneScreen summary={summary} onBack={handleBack} />;
}
