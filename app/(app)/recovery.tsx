import { useRouter } from "expo-router";
import { useRuntimeBootstrap } from "../../src/runtime/RuntimeBootstrapProvider";
import { RecoveryScreen } from "../../src/ui/FoundationScreens";

export default function RecoveryRoute() {
  const router = useRouter();
  const runtime = useRuntimeBootstrap();

  const handleHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/child-world");
    }
  };

  return <RecoveryScreen onReload={() => void runtime.reload()} onHome={handleHome} />;
}
