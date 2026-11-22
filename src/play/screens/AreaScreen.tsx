import { useMemo, useState } from "react";
import { playType } from "../../ui/typography";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Area } from "../areas";
import { gamesForArea, TEMPLATES, type GameMeta, type TemplateId } from "../catalog";
import { useAccess } from "../account/useAccess";
import { useProgress } from "../progress";
import { play } from "../theme";
import { GameIconView, PlayScreen, RoundButton, Sub, Title, usePlaySize } from "../ui";
import { speak } from "../voice";

type Filter = "all" | TemplateId;

export function AreaScreen({ area, onBack, onOpenGame }: { area: Area; onBack: () => void; onOpenGame: (game: GameMeta) => void }) {
  const { width } = usePlaySize();
  const games = gamesForArea(area.id);
  const [filter, setFilter] = useState<Filter>("all");
  const { best } = useProgress();
  const access = useAccess();
  const kinds = useMemo(() => [...new Set(games.map((g) => g.template))], [games]);
  const shown = filter === "all" ? games : games.filter((g) => g.template === filter);
  const columns = width >= 1000 ? 6 : width >= 700 ? 5 : 4;

  return <PlayScreen>
    <View style={styles.top}>
      <RoundButton kind="back" label="Về nhà" onPress={onBack} />
      <View style={styles.titleBox}>
        <Title>{area.name}</Title>
        <Sub>{access.plan === "limited" ? `${games.filter((g) => access.canPlay(g.id)).length} trò miễn phí · trò khác hỏi bố mẹ nhé` : `${games.length} trò · con chọn trò nào cũng được`}</Sub>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
        {(["all", ...kinds] as Filter[]).map((k) => <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: filter === k }}
          onPress={() => setFilter(k)} style={[styles.chip, filter === k && styles.chipOn]}>
          <Text style={[styles.chipText, filter === k && styles.chipTextOn]}>{k === "all" ? "Tất cả" : TEMPLATES[k].name}</Text>
        </Pressable>)}
      </ScrollView>
    </View>
    <View style={styles.panel}>
      <ScrollView contentContainerStyle={styles.grid}>
        {shown.map((game) => <Pressable key={game.id} accessibilityRole="button" accessibilityLabel={game.title}
          onPress={() => { void speak(game.title); onOpenGame(game); }}
          style={({ pressed }) => [styles.card, { width: `${100 / columns - 2}%` }, pressed && styles.pressed]}>
          <View style={[styles.pic, { backgroundColor: TEMPLATES[game.template].tint }]}>
            <GameIconView icon={game.icon} size={50} />
            {access.canPlay(game.id) ? null : <View style={styles.lock}><Text style={styles.lockText}>Hỏi bố mẹ</Text></View>}
            <View style={styles.stars} accessibilityLabel={`Xong ${best[game.id] ?? 0} trên 3 mức`}>
              {[0, 1, 2].map((i) => <Text key={i} style={[styles.star, i < (best[game.id] ?? 0) && styles.starOn]}>★</Text>)}
            </View>
          </View>
          <Text numberOfLines={2} style={styles.cardTitle}>{game.title}</Text>
          <Text style={styles.cardMeta}>{TEMPLATES[game.template].name} · {game.ages} tuổi</Text>
        </Pressable>)}
      </ScrollView>
    </View>
  </PlayScreen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54 },
  titleBox: { flexShrink: 0 },
  chipScroll: { flexGrow: 1, flexShrink: 1 },
  chips: { gap: 6, paddingLeft: 10, alignItems: "center", flexGrow: 1, justifyContent: "flex-end" },
  chip: { minHeight: 38, paddingHorizontal: 12, borderRadius: 19, backgroundColor: "#FFFFFF", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "#DFE5EF" },
  chipOn: { backgroundColor: play.blue, borderBottomColor: "#0F52C0" },
  chipText: { ...playType.bodyBold, fontSize: 13, color: play.ink },
  chipTextOn: { color: "#FFFFFF" },
  panel: { flex: 1, marginTop: 6, backgroundColor: play.panel, borderRadius: 24, overflow: "hidden" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10, padding: 10 },
  card: { backgroundColor: play.card, borderRadius: 18, padding: 7, gap: 3, shadowColor: play.shadow, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  pic: { height: 64, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  lock: { position: "absolute", left: 4, bottom: 4, backgroundColor: "rgba(28,42,90,0.75)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  lockText: { ...playType.bodyBold, fontSize: 10, color: "#FFFFFF" },
  stars: { position: "absolute", top: 3, right: 5, flexDirection: "row" },
  star: { ...playType.title, fontSize: 12, lineHeight: 14, color: "rgba(255,255,255,0.75)" },
  starOn: { color: "#FFB400" },
  cardTitle: { ...playType.title, fontSize: 14, lineHeight: 16, color: play.ink, minHeight: 32 },
  cardMeta: { ...playType.body, fontSize: 11, color: play.soft },
  pressed: { transform: [{ scale: 0.96 }] },
});
