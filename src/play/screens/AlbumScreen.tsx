import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { playType } from "../../ui/typography";
import { findGame } from "../catalog";
import { useProgress } from "../progress";
import { STICKERS, earnedStickers } from "../stickers";
import { StickerView } from "../StickerView";
import { play } from "../theme";
import { PlayScreen, RoundButton, Sub, Title, usePlaySize } from "../ui";
import { speak, stopSpeaking } from "../voice";

/** Sticker album: one sticker per game, earned at the Khó level. Locked ones say which game gives them. */
export function AlbumScreen({ onBack }: { onBack: () => void }) {
  const progress = useProgress();
  const earned = new Set(earnedStickers(progress).map((s) => s.gameId));
  const { width } = usePlaySize();
  const columns = width >= 1000 ? 9 : width >= 700 ? 7 : 6;
  const size = Math.min(92, (width - 120) / columns - 14);

  useEffect(() => {
    const line = earned.size ? `Con có ${earned.size} sticker rồi. Giỏi quá!` : "Con chơi xong mức Khó của một trò để nhận sticker nhé!";
    const t = setTimeout(() => void speak(line), 400);
    return () => { clearTimeout(t); stopSpeaking(); };
  }, [earned.size]);

  return <PlayScreen>
    <View style={styles.top}>
      <RoundButton kind="back" label="Về nhà" onPress={onBack} />
      <View>
        <Title>Album sticker của bé</Title>
        <Sub>{earned.size} / {STICKERS.length} sticker · xong mức Khó của trò nào thì nhận sticker trò đó</Sub>
      </View>
    </View>
    <View style={styles.panel}>
      <ScrollView contentContainerStyle={styles.grid}>
        {STICKERS.map((s) => {
          const has = earned.has(s.gameId);
          const game = findGame(s.gameId);
          return <Pressable key={s.gameId} accessibilityRole="button" accessibilityLabel={has ? s.praise : `Sticker của trò ${game?.title ?? ""}, chưa có`}
            onPress={() => void speak(has ? s.praise : `Con chơi xong mức Khó trò ${game?.title ?? ""} để nhận sticker này nhé.`)}
            style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
            <StickerView sticker={s} size={size} locked={!has} />
            <Text numberOfLines={1} style={[styles.name, { width: size + 12 }]}>{game?.title}</Text>
          </Pressable>;
        })}
      </ScrollView>
    </View>
  </PlayScreen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54 },
  panel: { flex: 1, marginTop: 6, backgroundColor: play.panel, borderRadius: 24, overflow: "hidden" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, padding: 14 },
  cell: { alignItems: "center", gap: 2 },
  name: { ...playType.body, fontSize: 10, color: play.soft, textAlign: "center" },
  pressed: { transform: [{ scale: 0.95 }] },
});
