import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RuntimeBootstrapProvider } from "../src/runtime/RuntimeBootstrapProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <RuntimeBootstrapProvider><Stack screenOptions={{ headerShown: false }} /></RuntimeBootstrapProvider>
    </GestureHandlerRootView>
  );
}
