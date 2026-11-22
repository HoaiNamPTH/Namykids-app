import { RequireAccount } from "../src/play/account/RequireAccount";
import { useRouter } from "expo-router";
import { AlbumScreen } from "../src/play/screens/AlbumScreen";

export default function AlbumRoute() {
  const router = useRouter();
  return <RequireAccount><AlbumScreen onBack={() => (router.canGoBack() ? router.back() : router.replace("/home"))} /></RequireAccount>;
}
