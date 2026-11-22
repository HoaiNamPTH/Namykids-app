import { useRouter } from "expo-router";
import { RecoveryScreen } from "../../src/ui/FoundationScreens";

export default function SessionRecoveryRoute() {
  const router = useRouter();
  return (
    <RecoveryScreen
      onReload={() => router.replace("/child-world")}
      onHome={() => router.replace("/child-world")}
    />
  );
}
