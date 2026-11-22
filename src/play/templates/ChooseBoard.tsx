import { useEffect, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { foundationAssets } from "../../ui/foundation-assets";
import { chooseResult } from "../engine/judge";
import type { Card, ChooseRound } from "../engine/types";
import { speak } from "../voice";
import { CardFace, PicView, useWiggle } from "./common";

type Props = { round: ChooseRound; width: number; height: number; listen: boolean; onSolved: () => void };
type Outcome = ReturnType<typeof chooseResult>;

/** Template for "Nghe và chọn" (listen: big speaker on the left) and "Chạm chọn". */
export function ChooseBoard({ round, width, height, listen, onSolved }: Props) {
  const [found, setFound] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  useEffect(() => { setFound([]); setLocked(false); }, [round]);

  const side = listen || round.scene ? Math.min(150, height * 0.55) + 24 : 0;
  const n = round.cards.length;
  const perRow = n <= 4 ? n : Math.ceil(n / 2);
  const rows = Math.ceil(n / perRow);
  const size = Math.max(64, Math.min(170, (width - side - 16 * perRow) / perRow, (height - 16 * rows) / rows));

  const tap = (card: Card): Outcome | null => {
    if (locked) return null;
    const result = chooseResult(round, found, card.id);
    if (result === "wrong") {
      void speak("Chưa đúng rồi. Con thử lại nhé.").then(() => speak(round.prompt));
    } else if (result === "done") {
      setFound([...found, card.id]);
      setLocked(true);
      void speak(round.praise).then(onSolved);
    } else if (result === "correct") {
      setFound([...found, card.id]);
      void speak(`Đúng rồi, ${card.say}!`);
    }
    return result;
  };

  return <View style={styles.wrap}>
    {round.scene ? <Pressable accessibilityRole="button" accessibilityLabel="Nghe lại" onPress={() => void speak(round.prompt)}
      style={({ pressed }) => [styles.bigSpeaker, styles.scene, { width: side - 24, height: side - 24, borderRadius: (side - 24) * 0.2 }, pressed && styles.pressed]}>
      <PicView pic={round.scene} size={side - 40} />
    </Pressable> : listen ? <Pressable accessibilityRole="button" accessibilityLabel="Nghe lại" onPress={() => void speak(round.prompt)}
      style={({ pressed }) => [styles.bigSpeaker, { width: side - 24, height: side - 24, borderRadius: side }, pressed && styles.pressed]}>
      <Image accessible={false} source={foundationAssets.speaker} resizeMode="contain" style={styles.fill} />
    </Pressable> : null}
    <View style={[styles.cards, { width: perRow * (size + 16) }]}>
      {round.cards.map((card) => <ChoiceCard key={card.id} card={card} size={size} ok={found.includes(card.id)} dim={locked && !found.includes(card.id)} onTap={tap} />)}
    </View>
  </View>;
}

function ChoiceCard({ card, size, ok, dim, onTap }: { card: Card; size: number; ok: boolean; dim: boolean; onTap: (c: Card) => Outcome | null }) {
  const wiggle = useWiggle();
  return <Animated.View style={wiggle.style}>
    <Pressable accessibilityRole="button" accessibilityLabel={ok ? card.say : "Thẻ tranh"} disabled={ok}
      onPress={() => { if (onTap(card) === "wrong") wiggle.run(); }}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <CardFace pic={card.pic} size={size} state={ok ? "ok" : dim ? "dim" : "idle"} />
    </Pressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  bigSpeaker: { backgroundColor: "#FFFFFF", padding: 8, shadowColor: "#1C2A5A", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  scene: { alignItems: "center", justifyContent: "center" },
  cards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 },
  fill: { width: "100%", height: "100%" },
  pressed: { transform: [{ scale: 0.95 }] },
});
