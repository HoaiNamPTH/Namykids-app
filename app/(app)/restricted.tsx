import { useRouter } from "expo-router";
import { RestrictedScreen } from "../../src/ui/FoundationScreens";

export default function RestrictedRoute() {
  const router = useRouter();

  const handleHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/child-world");
    }
  };

  return <RestrictedScreen onHome={handleHome} />;
}
