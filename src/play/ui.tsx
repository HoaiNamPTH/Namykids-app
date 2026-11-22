import { createContext, useContext, type PropsWithChildren, type ReactNode } from "react";
import { playType } from "../ui/typography";
import { Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { foundationAssets } from "../ui/foundation-assets";
import type { GameIcon } from "./catalog";
import { ITEMS } from "./items";
import { IPHONE_12_LANDSCAPE, play } from "./theme";
import { speak } from "./voice";

type Size = { width: number; height: number; framed: boolean };
const SizeContext = createContext<Size | null>(null);

/**
 * On a computer browser the app is shown inside an iPhone 12 frame held sideways, so the
 * Product Owner sees the phone layout. On a phone or tablet it fills the screen.
 */
export function PlayFrame({ children }: PropsWithChildren) {
  const win = useWindowDimensions();
  const frame = Platform.OS === "web" && win.width >= IPHONE_12_LANDSCAPE.width + 80 && win.height >= IPHONE_12_LANDSCAPE.height + 80;
  if (!frame) {
    const portrait = win.height > win.width && win.width < 600;
    return <SizeContext.Provider value={{ width: win.width, height: win.height, framed: false }}>
      {children}
      {portrait ? <RotateHint /> : null}
    </SizeContext.Provider>;
  }
  return <View style={styles.desk}>
    <View style={[styles.phone, IPHONE_12_LANDSCAPE]}>
      <SizeContext.Provider value={{ ...IPHONE_12_LANDSCAPE, framed: true }}>{children}</SizeContext.Provider>
    </View>
    <Text style={styles.deskNote}>Bản xem trước trên máy tính · khung iPhone 12 xoay ngang</Text>
  </View>;
}

export function usePlaySize(): Size {
  const ctx = useContext(SizeContext);
  const win = useWindowDimensions();
  return ctx ?? { width: win.width, height: win.height, framed: false };
}

function RotateHint() {
  return <View style={styles.rotate}>
    <Image source={foundationAssets.namiGuide} style={{ width: 140, height: 196 }} resizeMode="contain" />
    <Text style={styles.rotateText}>Bố mẹ xoay ngang điện thoại để chơi nhé!</Text>
  </View>;
}

/** Meadow background plus safe padding for every kid screen. */
export function PlayScreen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const insets = useSafeAreaInsets();
  const { framed } = usePlaySize();
  return <View style={styles.screen}>
    <Image accessible={false} source={foundationAssets.background} resizeMode="cover" style={StyleSheet.absoluteFill} />
    <View style={[styles.safe, {
      paddingTop: (framed ? 0 : insets.top) + 10,
      paddingBottom: (framed ? 0 : insets.bottom) + 10,
      paddingLeft: (framed ? 34 : Math.max(insets.left, 20)) + 6,
      paddingRight: (framed ? 34 : Math.max(insets.right, 20)) + 6,
    }, style]}>{children}</View>
  </View>;
}

export function RoundButton({ kind, label, onPress, size = 50 }: { kind: "back" | "speaker"; label: string; onPress: () => void; size?: number }) {
  const source = kind === "back" ? foundationAssets.back : foundationAssets.speaker;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}
    style={({ pressed }) => [{ width: size, height: size }, pressed && styles.pressed]}>
    <Image accessible={false} source={source} resizeMode="contain" style={styles.fill} />
  </Pressable>;
}

/** A line the guide says. Tapping the yellow speaker says it again. */
export function SayBubble({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.bubble, style]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Nghe lại" onPress={() => void speak(text)} style={({ pressed }) => [styles.sayDot, pressed && styles.pressed]}>
      <Image accessible={false} source={foundationAssets.speaker} resizeMode="contain" style={styles.fill} />
    </Pressable>
    <Text style={styles.bubbleText}>{text}</Text>
  </View>;
}

export function Title({ children, size = 26 }: { children: ReactNode; size?: number }) {
  return <Text accessibilityRole="header" style={[styles.title, { fontSize: size, lineHeight: size * 1.1 }]}>{children}</Text>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}

/** Picture for a game card: a 3D item picture or a big letter. */
export function GameIconView({ icon, size }: { icon: GameIcon; size: number }) {
  if ("item" in icon) {
    return <Image accessible={false} source={ITEMS[icon.item].image as ImageSourcePropType} resizeMode="contain" style={{ width: size, height: size }} />;
  }
  const fontSize = icon.glyph.length > 2 ? size * 0.42 : size * 0.62;
  return <Text style={[styles.glyph, { fontSize, lineHeight: fontSize * 1.15 }]}>{icon.glyph.replace("_", "·")}</Text>;
}

export const styles = StyleSheet.create({
  desk: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#2C3E66", gap: 14 },
  phone: { borderRadius: 44, overflow: "hidden", borderWidth: 10, borderColor: "#10182B", boxSizing: "content-box" } as ViewStyle,
  deskNote: { color: "#DDE6FF", ...playType.body, fontSize: 13 },
  rotate: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#BFE6FF", alignItems: "center", justifyContent: "center", padding: 24, gap: 12, zIndex: 99 },
  rotateText: { ...playType.title, fontSize: 24, color: play.ink, textAlign: "center" },
  screen: { flex: 1, backgroundColor: "#BFE6FF", overflow: "hidden" },
  safe: { flex: 1 },
  fill: { width: "100%", height: "100%" },
  pressed: { transform: [{ scale: 0.96 }] },
  bubble: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 10, shadowColor: play.shadow, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  bubbleText: { flexShrink: 1, ...playType.body, fontSize: 15, lineHeight: 20, color: play.ink },
  sayDot: { width: 40, height: 40 },
  title: { ...playType.title, color: play.ink, textShadowColor: "rgba(255,255,255,0.9)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 },
  sub: { ...playType.body, fontSize: 13, color: play.ink },
  glyph: { ...playType.title, color: play.ink, textAlign: "center" },
});
