import { RequireAccount } from "../../src/play/account/RequireAccount";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { findArea } from "../../src/play/areas";
import { AreaScreen } from "../../src/play/screens/AreaScreen";

export default function AreaRoute() {
  const router = useRouter();
  const { areaId } = useLocalSearchParams<{ areaId: string }>();
  const area = findArea(areaId);
  if (!area || !area.open) return <Redirect href="/home" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/home"));
  return <RequireAccount><AreaScreen area={area} onBack={back} onOpenGame={(game) => router.push(`/game/${game.id}`)} /></RequireAccount>;
}
