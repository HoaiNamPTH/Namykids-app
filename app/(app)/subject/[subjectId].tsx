import { useLocalSearchParams, useRouter } from "expo-router";
import { useRuntimeBootstrap } from "../../../src/runtime/RuntimeBootstrapProvider";
import { LoadingScreen, RecoveryScreen, RestrictedScreen, SubjectJourneyScreen } from "../../../src/ui/FoundationScreens";

export default function SubjectRoute() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const runtime = useRuntimeBootstrap();

  if (runtime.status === "recovery") {
    return <RecoveryScreen onReload={() => void runtime.reload()} onHome={() => router.replace("/child-world")} />;
  }
  if (runtime.status === "restricted" || (subjectId && subjectId !== "alphabet")) {
    return <RestrictedScreen onHome={() => router.replace("/child-world")} />;
  }
  if (runtime.status === "loading") {
    return <LoadingScreen />;
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/child-world");
    }
  };

  return (
    <SubjectJourneyScreen
      onBack={handleBack}
      onStart={() => router.push("/activity/alphabet-missing-letters")}
    />
  );
}
