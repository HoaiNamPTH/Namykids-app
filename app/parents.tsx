import { useRouter } from "expo-router";
import { RequireAccount } from "../src/play/account/RequireAccount";
import { ParentScreen } from "../src/play/screens/ParentScreen";

export default function ParentsRoute() {
  const router = useRouter();
  return <RequireAccount>
    <ParentScreen onBack={() => (router.canGoBack() ? router.back() : router.replace("/home"))} onSignedOut={() => router.replace("/login")} />
  </RequireAccount>;
}
