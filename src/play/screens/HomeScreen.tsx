import { useEffect, useState } from "react";
import { playType } from "../../ui/typography";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { foundationAssets } from "../../ui/foundation-assets";
import { AREAS, type Area } from "../areas";
import { useAccess } from "../account/useAccess";
import { useProgress } from "../progress";
import { earnedStickers } from "../stickers";
import { play } from "../theme";
import { PlayScreen, SayBubble, usePlaySize } from "../ui";
import { speak } from "../voice";

const GREETING = "Chào con! Con chơi gì nào?";

export function HomeScreen({ onOpenArea, onOpenAlbum, onOpenParents }: { onOpenArea: (area: Area) => void; onOpenAlbum: () => void; onOpenParents: () => void }) {
  const access = useAccess();
  const stickers = earnedStickers(useProgress()).length;
  const { width, height } = usePlaySize();
  const [soon, setSoon] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => void speak(GREETING), 500);
    return () => clearTimeout(t);
  }, []);

  const compact = height < 450;
  const leftWidth = Math.min(width * 0.3, 300);
  const gap = compact ? 10 : 16;
  // Two rows (3 + 2) so each picture is big enough for a small finger.
  const cardWidth = Math.min((width - leftWidth - 80 - gap * 2) / 3, (height - 70 - gap) / 2 - 30);

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

  // Simple for a 2–6 year old: the guide, five big pictures, two small corner buttons for grown-ups.
  return <PlayScreen style={styles.row}>
    <View style={[styles.left, { width: leftWidth }]}>
      <SayBubble text={GREETING} style={styles.hello} />
      <Image accessible={false} source={foundationAssets.namiGuide} resizeMode="contain" style={styles.nami} />
    </View>
    <View style={styles.right}>
      <View style={styles.corner}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Album sticker, ${stickers} sticker`} onPress={() => { void speak("Album sticker của con"); onOpenAlbum(); }}
          style={({ pressed }) => [styles.cornerBtn, pressed && styles.pressed]}>
          <Text style={styles.cornerStar}>★</Text>
          {stickers ? <View style={styles.count}><Text style={styles.countText}>{stickers}</Text></View> : null}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={access.plan === "trial" ? `Góc phụ huynh, còn ${access.daysLeft} ngày dùng thử` : "Góc phụ huynh"} onPress={onOpenParents}
          style={({ pressed }) => [styles.cornerBtn, styles.cornerParent, pressed && styles.pressed]}>
          <Text style={styles.cornerParentText}>Bố mẹ</Text>
        </Pressable>
      </View>
      <View style={[styles.areas, { gap }]}>
        {AREAS.map((area) => <Pressable key={area.id} accessibilityRole="button" accessibilityLabel={area.open ? area.name : `${area.name}, sắp có`}
          onPress={() => tapArea(area)}
          style={({ pressed }) => [styles.area, { width: cardWidth }, !area.open && styles.areaClosed, pressed && styles.pressed]}>
          <View style={[styles.iconBox, { backgroundColor: area.tint }]}>
            <Image accessible={false} source={area.icon} resizeMode="contain" style={styles.icon} />
          </View>
          <Text numberOfLines={2} style={[styles.areaName, compact && styles.areaNameCompact]}>{soon === area.id ? "Sắp có!" : area.name}</Text>
        </Pressable>)}
      </View>
    </View>
  </PlayScreen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16 },
  left: { justifyContent: "flex-end", gap: 4 },
  hello: { alignSelf: "flex-start" },
  corner: { position: "absolute", top: 0, right: 0, flexDirection: "row", gap: 8 },
  cornerBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: play.shadow, shadowOpacity: 0.14, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cornerStar: { ...playType.title, fontSize: 26, lineHeight: 30, color: "#FFB400" },
  count: { position: "absolute", top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: play.leaf, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  countText: { ...playType.bodyBold, fontSize: 11, color: "#FFFFFF" },
  cornerParent: { width: "auto", paddingHorizontal: 12, borderRadius: 23 },
  cornerParentText: { ...playType.bodyBold, fontSize: 13, color: play.soft },
  areaClosed: { opacity: 0.55 },
  nami: { flex: 1, width: "100%", alignSelf: "flex-start" },
  right: { flex: 1, justifyContent: "center" },
  areas: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "stretch", marginTop: 40 },
  area: { backgroundColor: play.card, borderRadius: 26, padding: 6, alignItems: "center", gap: 4, shadowColor: play.shadow, shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5 },

  iconBox: { width: "100%", aspectRatio: 1, borderRadius: 18, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  icon: { width: "88%", height: "88%" },
  areaName: { ...playType.title, fontSize: 18, lineHeight: 20, color: play.ink, textAlign: "center" },
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
