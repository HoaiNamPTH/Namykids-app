import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import duo from "../../assets/play/ui/win_duo.jpg";
import banner from "../../assets/play/ui/win_banner.png";
import { playType } from "../../ui/typography";
import type { GameMeta } from "../catalog";
import { LEVEL_NAMES, type GameContent, type Level, type Round } from "../engine/types";
import { recordCompletion } from "../progress";
import { ChooseBoard } from "../templates/ChooseBoard";
import { RoundDots } from "../templates/common";
import { FlipBoard } from "../templates/FlipBoard";
import { FillBoard } from "../templates/FillBoard";
import { MatchBoard } from "../templates/MatchBoard";
import { play } from "../theme";
import { foundationAssets } from "../../ui/foundation-assets";
import { PlayScreen, RoundButton, SayBubble } from "../ui";
import { speak, stopSpeaking } from "../voice";

/** Spoken when a game is finished. Warm, short, about effort as much as result. */
const PRAISE = [
  "Giỏi quá! Con làm xong rồi!", "Tuyệt vời! Nami và Niko rất vui!", "Con giỏi lắm! Mình chơi tiếp nhé!", "Hoan hô con! Con làm rất tốt!",
  "Con chăm chỉ quá! Nami thương con lắm!", "Con nghe giỏi ghê! Niko vỗ tay nè!", "Xuất sắc! Con cố gắng lắm đó!", "Ôi, con làm được rồi! Cừ quá!",
];

export function GamePlayer({ game, content, startLevel, onBack, onOtherGame }: {
  game: GameMeta; content: GameContent; startLevel: Level; onBack: () => void; onOtherGame: () => void;
}) {
  const [level, setLevel] = useState<Level>(startLevel);
  const [seed, setSeed] = useState(0);
  const rounds = useMemo<Round[]>(() => content.rounds(level, Math.random), [content, level, seed]);
  const [index, setIndex] = useState(0);
  const [won, setWon] = useState<string | null>(null);
  const [board, setBoard] = useState({ width: 600, height: 260 });
  const round = rounds[index];

  useEffect(() => { setIndex(0); setWon(null); }, [rounds]);
  useEffect(() => {
    if (!round || won) return;
    const t = setTimeout(() => void speak(round.prompt), 350);
    return () => clearTimeout(t);
  }, [round, won]);
  useEffect(() => () => stopSpeaking(), []);

  const solved = useCallback(() => {
    if (index + 1 < rounds.length) { setIndex(index + 1); return; }
    recordCompletion(game.id, level);
    const line = PRAISE[Math.floor(Math.random() * PRAISE.length)] ?? PRAISE[0] ?? "";
    setWon(line);
    void speak(line);
  }, [index, rounds.length, game.id, level]);

  const restart = (next: Level) => { stopSpeaking(); setLevel(next); setSeed((s) => s + 1); };
  const onLayout = (e: LayoutChangeEvent) => setBoard({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });

  if (won) return <WinPanel line={won} level={level} onReplay={() => restart(level)} onNext={level < 2 ? () => restart((level + 1) as Level) : undefined} onOther={onOtherGame} />;

  // Voice-first play (design v2): Nami says each instruction, the same line is shown in her bubble,
  // and the bubble or the speaker plays it again.
  return <PlayScreen>
    <View style={styles.top}>
      <RoundButton kind="back" label="Quay lại" onPress={onBack} />
      <View style={styles.dots}><RoundDots total={rounds.length} done={index} /></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Mức ${LEVEL_NAMES[level]}`} onPress={() => restart(((level + 1) % 3) as Level)} style={styles.levelPill}>
        <Text style={styles.levelText}>Mức {LEVEL_NAMES[level]}</Text>
        <View style={styles.levelDots}>{[0, 1, 2].map((i) => <View key={i} style={[styles.levelDot, i <= level && styles.levelDotOn]} />)}</View>
      </Pressable>
      <RoundButton kind="speaker" label="Nghe lại" onPress={() => round && void speak(round.prompt)} />
    </View>
    <View style={styles.stage}>
      <View style={styles.guide}>
        {round ? <SayBubble text={round.prompt} style={styles.guideBubble} /> : null}
        <Image accessible={false} source={foundationAssets.namiGuide} resizeMode="contain" style={styles.guideNami} />
      </View>
      <View style={styles.board} onLayout={onLayout}>
        {round?.kind === "choose" ? <ChooseBoard key={`${seed}-${index}`} round={round} width={board.width} height={board.height} listen={false} onSolved={solved} /> : null}
        {round?.kind === "match" ? <MatchBoard key={`${seed}-${index}`} round={round} width={board.width} height={board.height} onSolved={solved} /> : null}
        {round?.kind === "flip" ? <FlipBoard key={`${seed}-${index}`} round={round} width={board.width} height={board.height} onSolved={solved} /> : null}
        {round?.kind === "fill" ? <FillBoard key={`${seed}-${index}`} round={round} width={board.width} height={board.height} onSolved={solved} /> : null}
      </View>
    </View>
  </PlayScreen>;
}

/** Celebration with Nami and Niko: the praise is spoken and shown; one big "play on" button. */
function WinPanel({ line, level, onReplay, onNext, onOther }: { line: string; level: Level; onReplay: () => void; onNext?: () => void; onOther: () => void }) {
  return <PlayScreen style={styles.win}>
    <View style={styles.duoFrame}><Image accessible={false} source={duo} resizeMode="cover" style={styles.duo} /></View>
    <View style={styles.winRight}>
      <Image accessible={false} source={banner} resizeMode="contain" style={styles.banner} />
      <SayBubble text={line} />
      <Pill label={onNext ? `Chơi tiếp · mức ${LEVEL_NAMES[level + 1]}` : "Chơi tiếp"} tone="green" onPress={onNext ?? onReplay} big />
      <View style={styles.smallRow}>
        <Pill label="Chơi lại" tone="white" onPress={onReplay} />
        <Pill label="Trò khác" tone="white" onPress={onOther} />
      </View>
    </View>
  </PlayScreen>;
}

function Pill({ label, tone, onPress, big = false }: { label: string; tone: "white" | "green" | "blue"; onPress: () => void; big?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.pill, styles[tone], big && styles.pillBig, pressed && { transform: [{ scale: 0.96 }] }]}>
    <Text style={[styles.pillText, big && styles.pillTextBig, tone === "white" && { color: play.ink }]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54 },
  dots: { flex: 1, alignItems: "center" },
  pillBig: { minHeight: 60, paddingHorizontal: 34, borderRadius: 30 },
  pillTextBig: { fontSize: 22 },
  smallRow: { flexDirection: "row", gap: 10 },
  stage: { flex: 1, flexDirection: "row", marginTop: 4 },
  guide: { width: "24%", justifyContent: "flex-end" },
  guideBubble: { marginBottom: -4, zIndex: 2 },
  guideNami: { width: "100%", height: "62%" },
  board: { flex: 1 },
  levelPill: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#FFFFFF" },
  levelText: { ...playType.bodyBold, fontSize: 13, color: play.ink },
  levelDots: { flexDirection: "row", gap: 3 },
  levelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#DDE3EE" },
  levelDotOn: { backgroundColor: play.leaf },
  win: { flexDirection: "row", alignItems: "center", gap: 12 },
  duoFrame: { width: "44%", aspectRatio: 635 / 372, borderRadius: 28, overflow: "hidden", borderWidth: 5, borderColor: "#FFFFFF", backgroundColor: "#E8F4FA" },
  duo: { width: "100%", height: "100%" },
  winRight: { flex: 1, alignItems: "center", gap: 10 },
  banner: { width: "86%", height: 90 },
  pill: { minHeight: 48, paddingHorizontal: 20, borderRadius: 24, justifyContent: "center", borderBottomWidth: 5 },
  white: { backgroundColor: "#FFFFFF", borderBottomColor: "#DFE5EF" },
  green: { backgroundColor: play.leaf, borderBottomColor: "#1E8A5C" },
  blue: { backgroundColor: play.blue, borderBottomColor: "#0F52C0" },
  pillText: { ...playType.title, fontSize: 17, color: "#FFFFFF" },
});
