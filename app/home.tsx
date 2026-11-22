import { RequireAccount } from "../src/play/account/RequireAccount";
import { useRouter } from "expo-router";
import { HomeScreen } from "../src/play/screens/HomeScreen";

export default function HomeRoute() {
  const router = useRouter();
  return <RequireAccount><HomeScreen onOpenArea={(area) => router.push(`/area/${area.id}`)} onOpenAlbum={() => router.push("/album")} onOpenParents={() => router.push("/parents")} /></RequireAccount>;
}
