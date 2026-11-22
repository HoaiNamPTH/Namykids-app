import { StyleSheet, Text, View } from "react-native";
import { playType } from "../ui/typography";
import type { Sticker } from "./stickers";
import { play } from "./theme";
import { GameIconView } from "./ui";

/** Round sticker: tinted badge, the game's picture, a little smiling face and the praise word. */
export function StickerView({ sticker, size, locked = false }: { sticker: Sticker; size: number; locked?: boolean }) {
  const eye = size * 0.05;
  return <View style={{ minWidth: size, alignItems: "center" }}>
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, borderWidth: size * 0.05, backgroundColor: locked ? "#E4E8F1" : sticker.tint }]}>
      {locked ? <Text style={[styles.q, { fontSize: size * 0.42 }]}>?</Text> : <>
        <View style={{ marginBottom: size * 0.2 }}><GameIconView icon={sticker.icon} size={size * 0.46} /></View>
        <View style={[styles.face, { bottom: size * 0.1, width: size * 0.34, paddingVertical: Math.max(2, size * 0.03) }]}>
          <View style={styles.eyes}>
            <View style={[styles.eye, { width: eye, height: eye, borderRadius: eye }]} />
            <View style={[styles.eye, { width: eye, height: eye, borderRadius: eye }]} />
          </View>
          <View style={[styles.smile, { width: size * 0.16, height: size * 0.08, borderBottomLeftRadius: size * 0.1, borderBottomRightRadius: size * 0.1, borderWidth: Math.max(2, size * 0.025) }]} />
        </View>
      </>}
    </View>
    <View style={[styles.ribbon, locked && styles.ribbonLocked, { marginTop: -size * 0.12 }]}>
      <Text numberOfLines={1} style={[styles.praise, { fontSize: Math.max(11, size * 0.13), lineHeight: Math.max(14, size * 0.17) }]}>{locked ? "Chưa có" : sticker.praise}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center", borderColor: "#FFFFFF", shadowColor: play.shadow, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 5, overflow: "hidden" },
  q: { ...playType.title, color: "#B4BCD0" },
  face: { position: "absolute", alignItems: "center", gap: 2, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 40 },
  eyes: { flexDirection: "row", gap: 6 },
  eye: { backgroundColor: play.ink },
  smile: { borderColor: play.ink, borderTopWidth: 0 },
  ribbon: { backgroundColor: play.blue, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 1, borderWidth: 2, borderColor: "#FFFFFF" },
  ribbonLocked: { backgroundColor: "#9AA3BF" },
  praise: { ...playType.title, color: "#FFFFFF" },
});
