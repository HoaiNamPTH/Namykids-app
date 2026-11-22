import { useRouter } from "expo-router";
import { HomeScreen } from "../src/play/screens/HomeScreen";

export default function HomeRoute() {
  const router = useRouter();
  return <HomeScreen onOpenArea={(area) => router.push(`/area/${area.id}`)} />;
}
