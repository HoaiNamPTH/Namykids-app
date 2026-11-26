import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { playType } from "../../ui/typography";
import { fillDone, fillFits, nextGap } from "../engine/judge";
import type { Card, FillRound } from "../engine/types";
import { play } from "../theme";
import { speak } from "../voice";
import { CardFace, PicView } from "./common";

type Props = { round: FillRound; width: number; height: number; onSolved: () => void };
type Rect = { x: number; y: number; w: number; h: number };
type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };

/**
 * Template for "Kéo thả điền thiếu" and "Sắp xếp".
 * Drag a card onto a gap, or tap a card and then tap a gap. In sequence mode a tap on a card
 * places it in the next empty gap. Letting go of a card away from every gap is a missed drag,
 * not a wrong answer: the card just goes back.
 */
export function FillBoard({ round, width, height, onSolved }: Props) {
  const [filled, setFilled] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState<{ id: string; n: number } | null>(null);
  const gapRefs = useRef<Record<number, Measurable | null>>({});
  const doneRef = useRef(false);
  useEffect(() => { setFilled({}); setSelected(null); doneRef.current = false; }, [round]);

  const cellCount = round.cells.length;
  const sceneSize = round.scene ? Math.min(120, height * 0.36) : 0;
  const size = Math.max(52, Math.min(100, (width - 12 * cellCount) / cellCount, (height - sceneSize - 40) / 2.3));

  const place = (cardId: string, cellIndex: number): boolean => {
    if (filled[cellIndex] !== undefined) return false;
    const card = round.tray.find((c) => c.id === cardId);
    if (!fillFits(round, cellIndex, cardId)) {
      setShakeKey({ id: cardId, n: Date.now() });
      void speak("Chưa đúng chỗ rồi. Con thử lại nhé.");
      return false;
    }
    const next = { ...filled, [cellIndex]: cardId };
    setFilled(next);
    setSelected(null);
    if (fillDone(round, next) && !doneRef.current) {
      doneRef.current = true;
      void speak(card?.say ?? "").then(() => speak(round.praise)).then(onSolved);
    } else if (card) {
      void speak(card.say);
    }
    return true;
  };

  const tapCard = (card: Card) => {
    if (round.inOrder) {
      const gap = nextGap(round, filled);
      if (gap !== null) place(card.id, gap);
      return;
    }
    setSelected(card.id);
    void speak(card.say);
  };

  const tapGap = (cellIndex: number) => {
    if (selected) place(selected, cellIndex);
  };

  const measureGaps = () => new Promise<Record<number, Rect>>((resolve) => {
    const entries = Object.entries(gapRefs.current).filter(([i, r]) => r && filled[Number(i)] === undefined);
    const out: Record<number, Rect> = {};
    if (!entries.length) return resolve(out);
    let left = entries.length;
    entries.forEach(([i, r]) => r?.measureInWindow((x, y, w, h) => { out[Number(i)] = { x, y, w, h }; if (--left === 0) resolve(out); }));
  });

  const placedIds = new Set(Object.values(filled));

  return <View style={styles.wrap}>
    {round.scene ? <View style={[styles.scene, { width: sceneSize, height: sceneSize }]}><PicView pic={round.scene} size={sceneSize} /></View> : null}
    <View style={styles.row}>
      {round.strung ? <View pointerEvents="none" style={[styles.cord, { top: size / 2 - 3 }]} /> : null}
      {round.cells.map((cell, i) => {
        if ("fixed" in cell) {
          return <Pressable key={i} accessibilityLabel={cell.say} onPress={() => cell.say && void speak(cell.say)}>
            <CardFace pic={cell.fixed} size={size} />
          </Pressable>;
        }
        const placed = round.tray.find((c) => c.id === filled[i]);
        return <Pressable key={i} accessibilityRole="button" accessibilityLabel={placed ? placed.say : "Ô trống"} onPress={() => tapGap(i)}
          ref={(r) => { gapRefs.current[i] = r as unknown as Measurable | null; }}>
          {placed ? <CardFace pic={placed.pic} size={size} state="ok" /> : <View style={[styles.gap, { width: size, height: size, borderRadius: size * 0.2 }]}>
            {cell.label ? <Text style={[styles.gapLabel, { fontSize: size * 0.32 }]}>{cell.label}</Text> : <Text style={[styles.gapLabel, { fontSize: size * 0.4 }]}>?</Text>}
          </View>}
        </Pressable>;
      })}
    </View>
    <View style={styles.tray}>
      {round.tray.map((card) => <DragCard key={card.id} card={card} size={size * 0.92} hidden={placedIds.has(card.id)} selected={selected === card.id}
        shake={shakeKey?.id === card.id ? shakeKey.n : 0}
        onTap={() => tapCard(card)}
        onDrop={async (cx, cy) => {
          const rects = await measureGaps();
          const hit = Object.entries(rects).find(([, r]) => cx > r.x - 16 && cx < r.x + r.w + 16 && cy > r.y - 16 && cy < r.y + r.h + 16);
          return hit ? place(card.id, Number(hit[0])) : false;
        }} />)}
    </View>
  </View>;
}

function DragCard({ card, size, hidden, selected, shake, onTap, onDrop }: {
  card: Card; size: number; hidden: boolean; selected: boolean; shake: number;
  onTap: () => void; onDrop: (cx: number, cy: number) => Promise<boolean>;
}) {
  const pos = useRef(new Animated.ValueXY()).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const start = useRef<Rect | null>(null);
  const view = useRef<View>(null);
  const [dragging, setDragging] = useState(false);
  const handlers = useRef({ onTap, onDrop });
  handlers.current = { onTap, onDrop };

  useEffect(() => {
    if (!shake) return;
    Animated.sequence([-8, 8, -5, 0].map((v) => Animated.timing(shakeX, { toValue: v, duration: 80, useNativeDriver: false }))).start();
  }, [shake, shakeX]);

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      view.current?.measureInWindow((x, y, w, h) => { start.current = { x, y, w, h }; });
    },
    onPanResponderMove: (_e, g) => {
      if (Math.hypot(g.dx, g.dy) > 6) setDragging(true);
      pos.setValue({ x: g.dx, y: g.dy });
    },
    onPanResponderRelease: (_e, g) => {
      const back = () => { setDragging(false); Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start(); };
      if (Math.hypot(g.dx, g.dy) < 8) { pos.setValue({ x: 0, y: 0 }); setDragging(false); handlers.current.onTap(); return; }
      const r = start.current;
      if (!r) return back();
      void handlers.current.onDrop(r.x + r.w / 2 + g.dx, r.y + r.h / 2 + g.dy).then((ok) => {
        if (ok) { pos.setValue({ x: 0, y: 0 }); setDragging(false); } else back();
      });
    },
    onPanResponderTerminate: () => { setDragging(false); Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(); },
  })).current;

  if (hidden) return <View style={{ width: size, height: size }} />;
  return <Animated.View ref={view} {...responder.panHandlers} accessibilityRole="button" accessibilityLabel={card.say}
    style={[{ transform: [{ translateX: Animated.add(pos.x, shakeX) }, { translateY: pos.y }] }, dragging && styles.lifted]}>
    <CardFace pic={card.pic} size={size} state={selected ? "selected" : "idle"} />
  </Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "space-evenly" },
  scene: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 24 },
  row: { flexDirection: "row", gap: 12, justifyContent: "center" },
  cord: { position: "absolute", left: -24, right: -24, height: 6, borderRadius: 3, backgroundColor: "#B07A4A" },
  gap: { backgroundColor: "#FFF8DC", borderWidth: 3, borderStyle: "dashed", borderColor: "#E0B000", alignItems: "center", justifyContent: "center" },
  gapLabel: { ...playType.title, color: "#C9A000" },
  tray: { flexDirection: "row", gap: 14, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.55)", zIndex: 5 },
  lifted: { zIndex: 50, elevation: 12, shadowColor: play.shadow, shadowOpacity: 0.3, shadowRadius: 14 },
});
