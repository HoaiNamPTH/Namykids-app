import { playType } from "../../ui/typography";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Area } from "../areas";
import { gamesForArea, TEMPLATES, type GameMeta } from "../catalog";
import { useAccess } from "../account/useAccess";
import { useProgress } from "../progress";
import { play } from "../theme";
import { GameIconView, PlayScreen, RoundButton, Title, usePlaySize } from "../ui";
import { speak } from "../voice";

export function AreaScreen({ area, onBack, onOpenGame }: { area: Area; onBack: () => void; onOpenGame: (game: GameMeta) => void }) {
  const { width } = usePlaySize();
  const games = gamesForArea(area.id);
  const { best } = useProgress();
  const access = useAccess();
  const columns = width >= 1000 ? 6 : 5;
  const tile = (width - 40) / columns - 14;

  // Big pictures, short names, nothing else: the child taps a picture to play.
  return <PlayScreen>
    <View style={styles.top}>
      <RoundButton kind="back" label="Về nhà" onPress={onBack} />
      <Title>{area.name}</Title>
    </View>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
      {games.map((game) => {
        const open = access.canPlay(game.id);
        return <Pressable key={game.id} accessibilityRole="button" accessibilityLabel={game.title}
          onPress={() => { void speak(game.title); onOpenGame(game); }}
          style={({ pressed }) => [styles.card, { width: tile }, pressed && styles.pressed]}>
          <View style={[styles.pic, { height: tile * 0.72, backgroundColor: TEMPLATES[game.template].tint }, !open && styles.closed]}>
            <GameIconView icon={game.icon} size={tile * 0.5} />
            <View style={styles.stars} accessibilityLabel={`Xong ${best[game.id] ?? 0} trên 3 mức`}>
              {[0, 1, 2].map((i) => <Text key={i} style={[styles.star, i < (best[game.id] ?? 0) && styles.starOn]}>★</Text>)}
            </View>
          </View>
          <Text numberOfLines={1} style={styles.cardTitle}>{game.title}</Text>
        </Pressable>;
      })}
    </ScrollView>
  </PlayScreen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 54 },
  scroll: { flex: 1, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, paddingBottom: 14 },
  card: { alignItems: "center", gap: 4 },
  pic: { width: "100%", borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#FFFFFF", shadowColor: play.shadow, shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  closed: { opacity: 0.45 },
  stars: { position: "absolute", bottom: 3, flexDirection: "row" },
  star: { ...playType.title, fontSize: 13, lineHeight: 15, color: "rgba(255,255,255,0.85)" },
  starOn: { color: "#FFB400" },
  cardTitle: { ...playType.title, fontSize: 14, lineHeight: 17, color: play.ink, textShadowColor: "rgba(255,255,255,0.9)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  pressed: { transform: [{ scale: 0.95 }] },
});
