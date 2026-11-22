import { useEffect } from "react";
import { playType } from "../../ui/typography";
import { Image, StyleSheet, Text, View } from "react-native";
import { foundationAssets } from "../../ui/foundation-assets";
import { TEMPLATES, type GameMeta } from "../catalog";
import { play } from "../theme";
import { GameIconView, PlayScreen, RoundButton, SayBubble, Title } from "../ui";
import { speak, stopSpeaking } from "../voice";

/** Milestone 1: the game page opens and the guide explains it. Play arrives with the templates in milestones 2 and 3. */
export function GameScreen({ game, onBack }: { game: GameMeta; onBack: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => void speak(game.intro), 500);
    return () => { clearTimeout(t); stopSpeaking(); };
  }, [game]);

  return <PlayScreen>
    <View style={styles.top}>
      <RoundButton kind="back" label="Quay lại" onPress={onBack} />
      <Title size={22}>{game.title}</Title>
      <View style={{ flex: 1 }} />
      <RoundButton kind="speaker" label="Nghe lại hướng dẫn" onPress={() => void speak(game.intro)} />
    </View>
    <View style={styles.body}>
      <Image accessible={false} source={foundationAssets.namiGuide} resizeMode="contain" style={styles.nami} />
      <View style={styles.side}>
        <SayBubble text={game.intro} />
        <View style={styles.card}>
          <View style={[styles.pic, { backgroundColor: TEMPLATES[game.template].tint }]}><GameIconView icon={game.icon} size={72} /></View>
          <View style={styles.cardText}>
            <Text style={styles.kind}>{TEMPLATES[game.template].name} · {game.ages} tuổi</Text>
            <Text style={styles.soon}>Trò này đang được làm. Bé chơi được ở bản tiếp theo (chặng {game.milestone}).</Text>
          </View>
        </View>
      </View>
    </View>
  </PlayScreen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54 },
  body: { flex: 1, flexDirection: "row", alignItems: "center", gap: 16 },
  nami: { width: "28%", height: "100%" },
  side: { flex: 1, gap: 12, maxWidth: 480 },
  card: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: play.panel, borderRadius: 22, padding: 10 },
  pic: { width: 96, height: 96, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1, gap: 4 },
  kind: { ...playType.bodyBold, fontSize: 13, color: play.blue },
  soon: { ...playType.body, fontSize: 15, lineHeight: 20, color: play.ink },
});
