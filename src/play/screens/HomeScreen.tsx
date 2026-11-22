import { useEffect, useState } from "react";
import { playType } from "../../ui/typography";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { foundationAssets } from "../../ui/foundation-assets";
import { AREAS, type Area } from "../areas";
import { gamesForArea } from "../catalog";
import { useAccess } from "../account/useAccess";
import { useProgress } from "../progress";
import { STICKERS, earnedStickers } from "../stickers";
import { play } from "../theme";
import { PlayScreen, SayBubble, usePlaySize } from "../ui";
import { onVoiceStatus, speak, type VoiceStatus } from "../voice";

const GREETING = "Chào con! Hôm nay mình chơi gì nhỉ?";

export function HomeScreen({ onOpenArea, onOpenAlbum, onOpenParents }: { onOpenArea: (area: Area) => void; onOpenAlbum: () => void; onOpenParents: () => void }) {
  const access = useAccess();
  const stickers = earnedStickers(useProgress()).length;
  const { width, height } = usePlaySize();
  const [voice, setVoice] = useState<VoiceStatus>("unknown");
  const [soon, setSoon] = useState<string | null>(null);
  useEffect(() => onVoiceStatus(setVoice), []);

  const compact = height < 450;
  const leftWidth = Math.min(width * 0.3, 300);
  const gap = compact ? 10 : 16;
  const cardWidth = (width - leftWidth - 80 - gap * 4) / 5;

  const tapArea = (area: Area) => {
    if (area.open) {
      void speak(area.name);
      onOpenArea(area);
      return;
    }
    setSoon(area.id);
    void speak(`Khu ${area.name} sắp có nhé! Con chơi khu Ngôn ngữ trước nha.`);
    setTimeout(() => setSoon(null), 2200);
  };

  return <PlayScreen style={styles.row}>
    <View style={[styles.left, { width: leftWidth }]}>
      <Text style={styles.logo}>
        {"NamyKids".split("").map((c, i) => <Text key={i} style={{ color: LOGO[i % LOGO.length] }}>{c}</Text>)}
      </Text>
      <SayBubble text={GREETING} />
      <Image accessible={false} source={foundationAssets.namiGuide} resizeMode="contain" style={styles.nami} />
    </View>
    <View style={styles.right}>
      <View style={styles.topRow}>
      {access.plan === "trial" ? <Text style={styles.trial}>Dùng thử · còn {access.daysLeft} ngày</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Góc phụ huynh" onPress={onOpenParents} style={({ pressed }) => [styles.album, styles.parents, pressed && styles.pressed]}>
        <Text style={styles.albumText}>Góc phụ huynh</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Album sticker, ${stickers} sticker`} onPress={() => { void speak("Album sticker của bé"); onOpenAlbum(); }}
        style={({ pressed }) => [styles.album, pressed && styles.pressed]}>
        <Text style={styles.albumStar}>★</Text>
        <Text style={styles.albumText}>Album sticker · {stickers}/{STICKERS.length}</Text>
      </Pressable>
      </View>
      {voice === "none" ? <Text style={styles.voiceNote}>Máy tính này chưa có giọng nữ tiếng Việt, nên bản xem trước chỉ hiện chữ. Mở bằng Chrome hoặc Edge để nghe giọng đọc.</Text> : null}
      <View style={[styles.areas, { gap }]}>
        {AREAS.map((area) => {
          const count = gamesForArea(area.id).length;
          return <Pressable key={area.id} accessibilityRole="button" accessibilityLabel={area.open ? `${area.name}, ${count} trò` : `${area.name}, sắp có`}
            onPress={() => tapArea(area)}
            style={({ pressed }) => [styles.area, { width: cardWidth }, area.open && styles.areaOpen, pressed && styles.pressed]}>
            <View style={[styles.iconBox, { backgroundColor: area.tint }]}>
              <Image accessible={false} source={area.icon} resizeMode="contain" style={styles.icon} />
            </View>
            <Text numberOfLines={2} style={[styles.areaName, compact && styles.areaNameCompact]}>{area.name}</Text>
            <Text style={[styles.areaMeta, !area.open && styles.areaSoon]}>{area.open ? `${count} trò` : soon === area.id ? "Sắp có nhé!" : "Sắp có"}</Text>
          </Pressable>;
        })}
      </View>
    </View>
  </PlayScreen>;
}

const LOGO = ["#6A3FD8", "#FF8A00", "#18B45B", "#1D6FF2", "#FF4F7A", "#6A3FD8", "#FFB400", "#1D6FF2"];

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16 },
  left: { justifyContent: "flex-end", gap: 6 },
  logo: { ...playType.title, fontSize: 34, lineHeight: 38, textShadowColor: "rgba(255,255,255,0.95)", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  nami: { flex: 1, width: "100%", alignSelf: "flex-start" },
  right: { flex: 1, justifyContent: "center", gap: 10 },
  voiceNote: { ...playType.body, fontSize: 12, color: play.ink, backgroundColor: "#FFF3C4", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  areas: { flexDirection: "row", alignItems: "stretch" },
  area: { backgroundColor: play.card, borderRadius: 24, padding: 8, alignItems: "center", gap: 4, shadowColor: play.shadow, shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  areaOpen: { borderWidth: 4, borderColor: play.sun },
  iconBox: { width: "100%", aspectRatio: 1, borderRadius: 18, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  icon: { width: "88%", height: "88%" },
  areaName: { ...playType.title, fontSize: 17, lineHeight: 19, color: play.ink, textAlign: "center" },
  areaNameCompact: { fontSize: 15, lineHeight: 17 },
  areaMeta: { ...playType.bodyBold, fontSize: 12, color: play.blue },
  areaSoon: { color: "#9AA3BF" },
  topRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  trial: { ...playType.bodyBold, fontSize: 12, color: play.ink, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  parents: { borderBottomColor: "#C7CFE2" },
  album: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF", borderRadius: 22, paddingHorizontal: 14, minHeight: 44, borderBottomWidth: 4, borderBottomColor: play.sun },
  albumStar: { ...playType.title, fontSize: 22, color: "#FFB400" },
  albumText: { ...playType.title, fontSize: 15, color: play.ink },
  pressed: { transform: [{ scale: 0.96 }] },
});
