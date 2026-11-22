import { useRouter } from "expo-router";
import { AlbumScreen } from "../src/play/screens/AlbumScreen";

export default function AlbumRoute() {
  const router = useRouter();
  return <AlbumScreen onBack={() => (router.canGoBack() ? router.back() : router.replace("/home"))} />;
}
