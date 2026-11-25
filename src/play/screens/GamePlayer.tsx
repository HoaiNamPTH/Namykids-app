import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import duo from "../../assets/play/ui/home_duo.png";
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
import { PlayScreen, RoundButton } from "../ui";
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
  // Nam 25/11/2026: every game explains itself out loud first, so the child never has to guess.
  // The intro is said once when the game opens, then each round's instruction follows.
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    if (!round || won) return;
    let live = true;
    const t = setTimeout(() => {
      if (intro) void speak(game.intro).then(() => { if (live) { setIntro(false); } });
      else void speak(round.prompt);
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [round, won, intro, game.intro]);
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

  if (won) return <WinPanel level={level} onReplay={() => restart(level)} onNext={level < 2 ? () => restart((level + 1) as Level) : undefined} onOther={onOtherGame} />;

  // Voice-first play (Nam 25/11/2026): Nami says each instruction by herself, with no speech bubble.
  // The same words are printed large at the top of the screen so a 5–6-year-old can read along;
  // tapping the words or the speaker plays them again.
  const said = round ? (intro ? game.intro : round.prompt) : "";
  return <PlayScreen>
    <View style={styles.top}>
      <RoundButton kind="back" label="Quay lại" onPress={onBack} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Nghe lại: ${said}`} onPress={() => said && void speak(said)} style={({ pressed }) => [styles.question, pressed && { opacity: 0.85 }]}>
        <Text numberOfLines={2} adjustsFontSizeToFit style={styles.questionText}>{said}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Mức ${LEVEL_NAMES[level]}`} onPress={() => restart(((level + 1) % 3) as Level)} style={styles.levelPill}>
        <Text style={styles.levelText}>Mức {LEVEL_NAMES[level]}</Text>
        <View style={styles.levelDots}>{[0, 1, 2].map((i) => <View key={i} style={[styles.levelDot, i <= level && styles.levelDotOn]} />)}</View>
      </Pressable>
      <RoundButton kind="speaker" label="Nghe lại" onPress={() => said && void speak(said)} />
    </View>
    <View style={styles.dots}><RoundDots total={rounds.length} done={index} /></View>
    <View style={styles.stage}>
      <View style={styles.guide}>
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

/** Celebration with Nami and Niko (design v3): no frames, no praise text (it is spoken),
 *  one row of buttons, and the back button at the top left for picking another game. */
function WinPanel({ level, onReplay, onNext, onOther }: { level: Level; onReplay: () => void; onNext?: () => void; onOther: () => void }) {
  return <PlayScreen>
    <View style={styles.winTop}><RoundButton kind="back" label="Trò khác" onPress={onOther} size={64} /></View>
    <View style={styles.win}>
      <Image accessible={false} source={duo} resizeMode="contain" style={styles.duo} />
      <View style={styles.winRight}>
        <Text style={styles.winTitle}>Chúc mừng con!</Text>
        <View style={styles.smallRow}>
          <Pill label="Chơi lại" tone="white" onPress={onReplay} big />
          {onNext ? <Pill label={`Chơi tiếp · mức ${LEVEL_NAMES[level + 1]}`} tone="green" onPress={onNext} big /> : null}
        </View>
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
  dots: { alignItems: "center", marginTop: 6 },
  question: { flex: 1, minHeight: 54, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 6, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.92)", shadowColor: play.shadow, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  questionText: { ...playType.titleSemi, fontSize: 24, lineHeight: 29, color: play.ink, textAlign: "center" },
  pillBig: { minHeight: 60, paddingHorizontal: 34, borderRadius: 30 },
  pillTextBig: { fontSize: 22 },
  smallRow: { flexDirection: "row", gap: 10 },
  stage: { flex: 1, flexDirection: "row", marginTop: 4 },
  guide: { width: "20%", justifyContent: "flex-end" },
  guideNami: { width: "100%", height: "92%" },
  board: { flex: 1 },
  levelPill: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#FFFFFF" },
  levelText: { ...playType.bodyBold, fontSize: 13, color: play.ink },
  levelDots: { flexDirection: "row", gap: 3 },
  levelDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#DDE3EE" },
  levelDotOn: { backgroundColor: play.leaf },
  winTop: { flexDirection: "row", minHeight: 56 },
  win: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  duo: { width: "46%", height: "100%" },
  winRight: { flex: 1, alignItems: "center", gap: 22 },
  winTitle: { ...playType.title, fontSize: 40, color: "#C2561A", textAlign: "center", textShadowColor: "#FFFFFF", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  pill: { minHeight: 48, paddingHorizontal: 20, borderRadius: 24, justifyContent: "center", borderBottomWidth: 5 },
  white: { backgroundColor: "#FFFFFF", borderBottomColor: "#DFE5EF" },
  green: { backgroundColor: play.leaf, borderBottomColor: "#1E8A5C" },
  blue: { backgroundColor: play.blue, borderBottomColor: "#0F52C0" },
  pillText: { ...playType.title, fontSize: 17, color: "#FFFFFF" },
});
