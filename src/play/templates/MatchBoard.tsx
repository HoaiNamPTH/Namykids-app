import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { matchResult } from "../engine/judge";
import type { Card, MatchRound } from "../engine/types";
import { speak } from "../voice";
import { CardFace, useWiggle } from "./common";

type Props = { round: MatchRound; width: number; height: number; onSolved: () => void };

/** Template for "Ghép đôi": tap a card in one row, then its partner in the other row (either order). */
export function MatchBoard({ round, width, height, onSolved }: Props) {
  const [matched, setMatched] = useState<string[]>([]);
  const [selected, setSelected] = useState<{ row: "top" | "bottom"; id: string } | null>(null);
  useEffect(() => { setMatched([]); setSelected(null); }, [round]);

  const n = round.top.length;
  const size = Math.max(60, Math.min(118, (width - 20 * n) / n, (height - 30) / 2));
  const isMatched = (row: "top" | "bottom", id: string) => (row === "top" ? matched.includes(id) : matched.some((t) => round.pairs[t] === id));

  /** Returns true when the tap was a wrong pairing (so the card shakes). */
  const tap = (row: "top" | "bottom", card: Card): boolean => {
    if (isMatched(row, card.id)) return false;
    if (!selected || selected.row === row) {
      setSelected({ row, id: card.id });
      void speak(card.say);
      return false;
    }
    const topId = row === "top" ? card.id : selected.id;
    const bottomId = row === "bottom" ? card.id : selected.id;
    const result = matchResult(round, matched, topId, bottomId);
    setSelected(null);
    if (result === "wrong") {
      void speak("Chưa đúng đôi rồi. Con thử lại nhé.");
      return true;
    }
    const next = [...matched, topId];
    setMatched(next);
    const top = round.top.find((c) => c.id === topId);
    const bottom = round.bottom.find((c) => c.id === bottomId);
    if (result === "done") void speak(`Đúng rồi! ${top?.say} và ${bottom?.say}. Con ghép xong rồi!`).then(onSolved);
    else void speak(`Đúng rồi! ${top?.say} và ${bottom?.say}.`);
    return false;
  };

  return <View style={styles.wrap}>
    {(["top", "bottom"] as const).map((row) => <View key={row} style={styles.row}>
      {(row === "top" ? round.top : round.bottom).map((card) => <MatchCard key={card.id} card={card} size={size}
        state={isMatched(row, card.id) ? "ok" : selected?.row === row && selected.id === card.id ? "selected" : "idle"}
        onTap={() => tap(row, card)} />)}
    </View>)}
  </View>;
}

function MatchCard({ card, size, state, onTap }: { card: Card; size: number; state: "ok" | "selected" | "idle"; onTap: () => boolean }) {
  const wiggle = useWiggle();
  return <Animated.View style={wiggle.style}>
    <Pressable accessibilityRole="button" accessibilityLabel={card.say} disabled={state === "ok"}
      onPress={() => { if (onTap()) wiggle.run(); }} style={({ pressed }) => [pressed && styles.pressed]}>
      <CardFace pic={card.pic} size={size} state={state} />
    </Pressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "space-evenly", alignItems: "center" },
  row: { flexDirection: "row", gap: 20, justifyContent: "center" },
  pressed: { transform: [{ scale: 0.95 }] },
});
