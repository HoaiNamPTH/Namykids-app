import { useRouter } from "expo-router";
import { useRuntimeBootstrap } from "../../src/runtime/RuntimeBootstrapProvider";
import { ChildWorldScreen, LoadingScreen, RecoveryScreen, RestrictedScreen } from "../../src/ui/FoundationScreens";

export default function ChildWorldRoute() {
  const router = useRouter();
  const runtime = useRuntimeBootstrap();

  if (runtime.status === "recovery") {
    return <RecoveryScreen onReload={() => void runtime.reload()} onHome={() => router.replace("/child-world")} />;
  }
  if (runtime.status === "restricted") {
    return <RestrictedScreen onHome={() => router.replace("/child-world")} />;
  }
  if (runtime.status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <ChildWorldScreen
      onAlphabet={() => router.push("/subject/alphabet")}
      onParent={() => router.push("/parent")}
      onRestricted={() => router.push("/restricted")}
    />
  );
}
