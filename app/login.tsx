import { useRouter } from "expo-router";
import { LoginScreen } from "../src/play/screens/LoginScreen";

export default function LoginRoute() {
  const router = useRouter();
  return <LoginScreen onDone={() => router.replace("/home")} />;
}
