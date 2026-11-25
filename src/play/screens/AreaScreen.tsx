import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import namiPeek from "../../assets/foundation-v1/illustrations/char_nami_loading_star.png";
import { playType } from "../../ui/typography";
import { useAccess } from "../account/useAccess";
import type { Area } from "../areas";
import { gamesForArea, TEMPLATES, type GameMeta, type TemplateId } from "../catalog";
import { useProgress } from "../progress";
import { play } from "../theme";
import { GameIconView, PlayScreen, RoundButton, Title, usePlaySize } from "../ui";
import { speak } from "../voice";

/** One short word per way of playing, so cards differ at a glance without much reading. */
const HOW: Record<TemplateId, { word: string; color: string }> = {
  "listen-choose": { word: "Nghe", color: "#1D6FF2" },
  "tap-select": { word: "Chạm", color: "#E08A00" },
  "match-pairs": { word: "Ghép", color: "#D2427A" },
  "drag-fill": { word: "Kéo", color: "#1E9A5C" },
  sequence: { word: "Xếp", color: "#7A4FD8" },
  "flip-cards": { word: "Lật", color: "#E2622B" },
};

/** Game list (design v2): picture, name, how you play and age on each card; Nami keeps the child company. */
export function AreaScreen({ area, onBack, onOpenGame }: { area: Area; onBack: () => void; onOpenGame: (game: GameMeta) => void }) {
  const { width, height } = usePlaySize();
  const games = gamesForArea(area.id);
  const { best } = useProgress();
  const access = useAccess();
  const side = Math.min(150, width * 0.17);
  const columns = 4;
  const tile = (width - 80 - side - 12 * columns) / columns;

  return <PlayScreen>
    <View style={styles.top}>
      <RoundButton kind="back" label="Về nhà" onPress={onBack} />
      <Image accessible={false} source={area.icon} resizeMode="cover" style={styles.groupPic} />
      <Title>{area.name}</Title>
    </View>
    <View style={styles.body}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {games.map((game) => {
          const open = access.canPlay(game.id);
          const how = HOW[game.template];
          return <Pressable key={game.id} accessibilityRole="button" accessibilityLabel={game.title}
            onPress={() => { void speak(game.title); onOpenGame(game); }}
            style={({ pressed }) => [styles.card, { width: tile }, pressed && styles.pressed]}>
            <View style={[styles.pic, { height: tile * 0.62, backgroundColor: TEMPLATES[game.template].tint }, !open && styles.closed]}>
              <GameIconView icon={game.icon} size={tile * 0.46} />
              <View style={styles.stars}>
                {[0, 1, 2].map((i) => <Text key={i} style={[styles.star, i < (best[game.id] ?? 0) && styles.starOn]}>★</Text>)}
              </View>
            </View>
            <Text numberOfLines={1} style={styles.cardTitle}>{game.title}</Text>
            <View style={styles.meta}>
              <View style={[styles.how, { backgroundColor: how.color }]}><Text style={styles.howText}>{how.word}</Text></View>
              <Text style={styles.age}>{game.ages} tuổi</Text>
            </View>
          </Pressable>;
        })}
      </ScrollView>
      <Image accessible={false} source={namiPeek} resizeMode="contain" style={{ width: side, height: Math.min(side * 0.8, height * 0.5), alignSelf: "flex-end" }} />
    </View>
  </PlayScreen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54 },
  groupPic: { width: 52, height: 43, borderRadius: 12, borderWidth: 3, borderColor: "#FFFFFF" },
  body: { flex: 1, flexDirection: "row", gap: 6, marginTop: 4 },
  scroll: { flex: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingBottom: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 5, gap: 3, shadowColor: play.shadow, shadowOpacity: 0.16, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 4, borderBottomWidth: 4, borderBottomColor: "#E3E8F2" },
  pic: { width: "100%", borderRadius: 16, alignItems: "center", justifyContent: "center" },
  closed: { opacity: 0.45 },
  stars: { position: "absolute", top: 4, right: 6, flexDirection: "row" },
  star: { ...playType.title, fontSize: 12, lineHeight: 14, color: "rgba(255,255,255,0.9)" },
  starOn: { color: "#FFB400" },
  cardTitle: { ...playType.title, fontSize: 14, lineHeight: 17, color: play.ink, paddingHorizontal: 3 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 3, paddingBottom: 2 },
  how: { borderRadius: 9, paddingHorizontal: 7, paddingVertical: 1 },
  howText: { ...playType.bodyBold, fontSize: 11, color: "#FFFFFF" },
  age: { ...playType.body, fontSize: 11, color: play.soft },
  pressed: { transform: [{ scale: 0.96 }] },
});
