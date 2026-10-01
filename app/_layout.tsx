import { Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { isFoundationPreviewEnabled, shouldBypassRuntimeBootstrap } from "../src/dev/foundation-preview-guard";
import { RuntimeBootstrapProvider } from "../src/runtime/RuntimeBootstrapProvider";

export default function RootLayout() {
  const segments = useSegments();
  const bypassRuntimeBootstrap = shouldBypassRuntimeBootstrap(segments.join("/"), isFoundationPreviewEnabled());
  const stack = <Stack screenOptions={{ headerShown: false }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {bypassRuntimeBootstrap
        ? stack
        : <RuntimeBootstrapProvider>{stack}</RuntimeBootstrapProvider>}
    </GestureHandlerRootView>
  );
}
