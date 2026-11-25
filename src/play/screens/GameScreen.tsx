import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { foundationAssets } from "../../ui/foundation-assets";
import { playType } from "../../ui/typography";
import { TEMPLATES, type GameMeta } from "../catalog";
import { GROUP_CONTENT } from "../content/groups";
import { LANGUAGE_CONTENT } from "../content/language";
import type { Level } from "../engine/types";
import { useAccess } from "../account/useAccess";
import { FREE_GAME_IDS } from "../account/access";
import { useProgress } from "../progress";
import { play } from "../theme";
import { GameIconView, PlayScreen, RoundButton, SayBubble, Title } from "../ui";
import { speak, stopSpeaking } from "../voice";
import { GamePlayer } from "./GamePlayer";

export function GameScreen({ game, onBack, onOtherGame, onParents }: { game: GameMeta; onBack: () => void; onOtherGame: () => void; onParents: () => void }) {
  const content = LANGUAGE_CONTENT[game.id] ?? GROUP_CONTENT[game.id];
  const progress = useProgress();
  const access = useAccess();
  if (!access.canPlay(game.id)) return <AskParent game={game} onBack={onBack} onParents={onParents} />;
  if (content) {
    const startLevel = Math.min(progress.best[game.id] ?? 0, 2) as Level;
    return <GamePlayer game={game} content={content} startLevel={startLevel} onBack={onBack} onOtherGame={onOtherGame} />;
  }
  return <ComingSoon game={game} onBack={onBack} />;
}

/** Games whose template arrives in a later milestone open on a page where the guide explains them. */
function ComingSoon({ game, onBack }: { game: GameMeta; onBack: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => void speak(`${game.intro} Trò này sắp có nhé!`), 500);
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
            <Text style={styles.soon}>Trò này sắp có. Bé chơi được ở bản tiếp theo (chặng {game.milestone}).</Text>
          </View>
        </View>
      </View>
    </View>
  </PlayScreen>;
}

/** LIMITED plan: a kind "ask your parent" page instead of a lock. */
function AskParent({ game, onBack, onParents }: { game: GameMeta; onBack: () => void; onParents: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => void speak(`Trò ${game.title} cần bố mẹ mở thêm nhé. Con chơi các trò khác trước nha.`), 400);
    return () => { clearTimeout(t); stopSpeaking(); };
  }, [game]);
  return <PlayScreen>
    <View style={styles.top}><RoundButton kind="back" label="Quay lại" onPress={onBack} /><Title size={22}>{game.title}</Title></View>
    <View style={styles.body}>
      <Image accessible={false} source={foundationAssets.namiGuide} resizeMode="contain" style={styles.nami} />
      <View style={styles.side}>
        <SayBubble text="Trò này cần bố mẹ mở thêm nhé. Con chơi các trò khác trước nha!" />
        <View style={styles.card}>
          <View style={[styles.pic, { backgroundColor: TEMPLATES[game.template].tint }]}><GameIconView icon={game.icon} size={72} /></View>
          <View style={styles.cardText}>
            <Text style={styles.kind}>Dành cho bố mẹ</Text>
            <Text style={styles.soon}>Hết 7 ngày dùng thử, bé vẫn chơi được {FREE_GAME_IDS.length} trò miễn phí. Mở gói đầy đủ trong Góc ba mẹ.</Text>
            <Text accessibilityRole="button" onPress={onParents} style={styles.link}>Vào Góc ba mẹ</Text>
          </View>
        </View>
      </View>
    </View>
  </PlayScreen>;
}

const styles = StyleSheet.create({
  link: { ...playType.bodyBold, fontSize: 14, color: play.blue, textDecorationLine: "underline", marginTop: 4 },
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
