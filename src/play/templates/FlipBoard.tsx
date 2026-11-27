import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { flipResult } from "../engine/judge";
import type { FlipCard, FlipRound } from "../engine/types";
import { play } from "../theme";
import { playType } from "../../ui/typography";
import { speak } from "../voice";
import { CardFace } from "./common";

type Props = { round: FlipRound; width: number; height: number; onSolved: () => void };

/** Template "Lật thẻ": turn two cards; a pair stays open, otherwise both turn back. */
export function FlipBoard({ round, width, height, onSolved }: Props) {
  const [open, setOpen] = useState<string[]>([]);
  const [kept, setKept] = useState<string[]>([]);
  const busy = useRef(false);
  useEffect(() => { setOpen([]); setKept([]); busy.current = false; }, [round]);

  const n = round.cards.length;
  const perRow = n <= 4 ? n : Math.ceil(n / 2);
  const rows = Math.ceil(n / perRow);
  const size = Math.max(60, Math.min(140, (width - 14 * perRow) / perRow, (height - 14 * rows) / rows));

  const tap = (card: FlipCard) => {
    if (busy.current || kept.includes(card.id) || open.includes(card.id)) return;
    const first = open[0] ?? "";
    // Nam 27/11/2026: two cards with the same name are named once.
    const firstSay = round.cards.find((c) => c.id === first)?.say;
    if (open.length === 0 || firstSay !== card.say) void speak(card.say);
    if (open.length === 0) { setOpen([card.id]); return; }
    const both = [first, card.id];
    setOpen(both);
    const result = flipResult(round, kept, first, card.id);
    busy.current = true;
    if (result === "wrong") {
      setTimeout(() => { setOpen([]); busy.current = false; }, 1300);
      return;
    }
    const nextKept = [...kept, ...both];
    setTimeout(() => {
      setKept(nextKept); setOpen([]); busy.current = false;
      if (result === "done") void speak(round.praise).then(onSolved);
      else void speak("Đúng cặp rồi!");
    }, 700);
  };

  return <View style={styles.wrap}>
    <View style={[styles.cards, { width: perRow * (size + 14) }]}>
      {round.cards.map((card) => <FlipTile key={card.id} card={card} size={size} face={open.includes(card.id) || kept.includes(card.id)} kept={kept.includes(card.id)} onTap={tap} />)}
    </View>
  </View>;
}

function FlipTile({ card, size, face, kept, onTap }: { card: FlipCard; size: number; face: boolean; kept: boolean; onTap: (c: FlipCard) => void }) {
  const turn = useRef(new Animated.Value(face ? 1 : 0)).current;
  useEffect(() => { Animated.timing(turn, { toValue: face ? 1 : 0, duration: 220, useNativeDriver: false }).start(); }, [face, turn]);
  const scaleX = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.05, 1] });
  return <Pressable accessibilityRole="button" accessibilityLabel={face ? card.say : "Thẻ úp"} disabled={kept} onPress={() => onTap(card)}>
    <Animated.View style={{ transform: [{ scaleX }] }}>
      {face ? <CardFace pic={card.pic} size={size} state={kept ? "ok" : "idle"} />
        : <View style={[styles.back, { width: size, height: size, borderRadius: size * 0.2 }]}><Text style={[styles.backMark, { fontSize: size * 0.4 }]}>?</Text></View>}
    </Animated.View>
  </Pressable>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  cards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14 },
  back: { backgroundColor: play.blue, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#FFFFFF", shadowColor: play.shadow, shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  backMark: { ...playType.title, color: "#FFFFFF" },
});
