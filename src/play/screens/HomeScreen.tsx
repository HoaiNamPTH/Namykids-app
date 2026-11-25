import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import duo from "../../assets/play/ui/home_duo.png";
import { playType } from "../../ui/typography";
import { AREAS, type Area } from "../areas";
import { gamesForArea } from "../catalog";
import { play } from "../theme";
import { PlayScreen, RoundButton, SayBubble, usePlaySize } from "../ui";
import { speak } from "../voice";
import { SoundSettings } from "./SoundSettings";

const GREETING = "Chào con! Hôm nay mình khám phá gì nhỉ?";
const LOGO = ["#6A3FD8", "#FF8A00", "#18B45B", "#1D6FF2", "#FF4F7A", "#6A3FD8", "#FFB400", "#1D6FF2"];

/**
 * Home (design v2, 25/11/2026): Nami and Niko welcome the child in the meadow; the 8 approved
 * learning groups as big picture cards; sound settings and "Góc ba mẹ" in the top corner.
 */
export function HomeScreen({ onOpenArea, onOpenParents }: { onOpenArea: (area: Area) => void; onOpenParents: () => void }) {
  const { width, height } = usePlaySize();
  const [soon, setSoon] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => void speak(GREETING), 500);
    return () => clearTimeout(t);
  }, []);

  const leftWidth = Math.min(width * 0.34, 320);
  const gap = 10;
  const card = Math.min((width - leftWidth - 92 - gap * 3) / 4, (height - 96 - gap) / 2 - 26);

  const tapArea = (area: Area) => {
    if (gamesForArea(area.id).length) {
      void speak(area.name);
      onOpenArea(area);
      return;
    }
    setSoon(area.id);
    void speak(`${area.name} sắp có nhé!`);
    setTimeout(() => setSoon(null), 2200);
  };

  return <PlayScreen style={styles.row}>
    <View style={[styles.left, { width: leftWidth }]}>
      <Text style={styles.logo}>{"NamyKids".split("").map((c, i) => <Text key={i} style={{ color: LOGO[i % LOGO.length] }}>{c}</Text>)}</Text>
      <SayBubble text={GREETING} style={styles.hello} />
      <Image accessible={false} source={duo} resizeMode="contain" style={styles.duo} />
    </View>
    <View style={styles.right}>
      <View style={styles.corner}>
        <RoundButton kind="speaker" label="Cài đặt âm thanh" size={44} onPress={() => setSettings(true)} />
        <Pressable accessibilityRole="button" accessibilityLabel="Góc ba mẹ" onPress={onOpenParents} style={({ pressed }) => [styles.parents, pressed && styles.pressed]}>
          <Text style={styles.parentsText}>Góc ba mẹ</Text>
        </Pressable>
      </View>
      <View style={[styles.grid, { gap }]}>
        {AREAS.map((area) => {
          const ready = gamesForArea(area.id).length > 0;
          return <Pressable key={area.id} accessibilityRole="button" accessibilityLabel={ready ? area.name : `${area.name}, sắp có`} onPress={() => tapArea(area)}
            style={({ pressed }) => [styles.card, { width: card }, pressed && styles.pressed]}>
            <Image accessible={false} source={area.icon} resizeMode="cover" style={[styles.pic, { height: card * 0.74 }, !ready && styles.soonPic]} />
            {!ready ? <View style={styles.soonTag}><Text style={styles.soonText}>{soon === area.id ? "Sắp có nhé!" : "Sắp có"}</Text></View> : null}
            <Text numberOfLines={2} style={styles.name}>{area.name}</Text>
          </Pressable>;
        })}
      </View>
    </View>
    {settings ? <SoundSettings onClose={() => setSettings(false)} /> : null}
  </PlayScreen>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  left: { justifyContent: "flex-end" },
  logo: { ...playType.title, fontSize: 30, lineHeight: 34, position: "absolute", top: 0, left: 0, textShadowColor: "rgba(255,255,255,0.95)", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  hello: { alignSelf: "flex-start", marginBottom: -6, zIndex: 2, maxWidth: "100%" },
  duo: { width: "100%", height: "66%", marginLeft: -12 },
  right: { flex: 1, justifyContent: "flex-end" },
  corner: { position: "absolute", top: 0, right: 0, flexDirection: "row", gap: 8, alignItems: "center" },
  parents: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: "#FFFFFF", justifyContent: "center", borderBottomWidth: 4, borderBottomColor: "#DDE3EE" },
  parentsText: { ...playType.title, fontSize: 15, color: play.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", marginBottom: 4 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 5, alignItems: "center", gap: 2, shadowColor: play.shadow, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 5, borderBottomWidth: 4, borderBottomColor: "#E3E8F2" },
  pic: { width: "100%", borderRadius: 17 },
  soonPic: { opacity: 0.55 },
  soonTag: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(28,42,90,0.72)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  soonText: { ...playType.bodyBold, fontSize: 10, color: "#FFFFFF" },
  name: { ...playType.title, fontSize: 13, lineHeight: 15, color: play.ink, textAlign: "center", minHeight: 30, textAlignVertical: "center" },
  pressed: { transform: [{ scale: 0.95 }] },
});
