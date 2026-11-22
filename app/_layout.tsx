import { Baloo2_700Bold, Baloo2_800ExtraBold } from "@expo-google-fonts/baloo-2";
import { Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { isFoundationPreviewEnabled, shouldBypassRuntimeBootstrap } from "../src/dev/foundation-preview-guard";
import { isPlayRoute } from "../src/play/play-routes";
import { PlayFrame } from "../src/play/ui";
import { RuntimeBootstrapProvider } from "../src/runtime/RuntimeBootstrapProvider";

export default function RootLayout() {
  const segments = useSegments();
  const path = segments.join("/");
  const [fontsLoaded, fontError] = useFonts({ Baloo2_700Bold, Baloo2_800ExtraBold, Nunito_700Bold, Nunito_800ExtraBold });
  const stack = <Stack screenOptions={{ headerShown: false }} />;
  if (!fontsLoaded && !fontError) return null;
  if (isPlayRoute(path)) {
    return <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar hidden />
      <PlayFrame>{stack}</PlayFrame>
    </GestureHandlerRootView>;
  }
  const bypassRuntimeBootstrap = shouldBypassRuntimeBootstrap(path, isFoundationPreviewEnabled());
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {bypassRuntimeBootstrap
        ? stack
        : <RuntimeBootstrapProvider>{stack}</RuntimeBootstrapProvider>}
    </GestureHandlerRootView>
  );
}
