import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { playType } from "../../ui/typography";
import { previewTrialEnded, signOut, useSession } from "../account/account";
import { accessFor, FREE_GAME_IDS, PRICE_LABEL, TRIAL_DAYS } from "../account/access";
import { findGame } from "../catalog";
import { LEVEL_NAMES } from "../engine/types";
import { useProgress } from "../progress";
import { earnedStickers, STICKERS } from "../stickers";
import { play } from "../theme";
import { onVoiceStatus, type VoiceStatus } from "../voice";
import { PlayScreen, RoundButton, Sub, Title } from "../ui";

/** "Hỏi bố mẹ": a sum a small child can't read yet keeps the parent area for grown-ups. */
function makeGate() {
  const a = 3 + Math.floor(Math.random() * 6);
  const b = 2 + Math.floor(Math.random() * 6);
  const answer = a + b;
  const options = [answer, answer + 2, answer - 1].sort(() => Math.random() - 0.5);
  return { text: `${a} + ${b} = ?`, answer, options };
}

export function ParentScreen({ onBack, onSignedOut }: { onBack: () => void; onSignedOut: () => void }) {
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState(makeGate);
  if (!open) {
    return <PlayScreen>
      <View style={styles.top}><RoundButton kind="back" label="Quay lại" onPress={onBack} /><Title>Góc phụ huynh</Title></View>
      <View style={styles.gate}>
        <Sub>Dành cho bố mẹ. Bố mẹ chọn đáp án đúng để vào nhé.</Sub>
        <Text style={styles.sum}>{gate.text}</Text>
        <View style={styles.opts}>
          {gate.options.map((o) => <Pressable key={o} accessibilityRole="button" onPress={() => (o === gate.answer ? setOpen(true) : setGate(makeGate()))}
            style={({ pressed }) => [styles.opt, pressed && styles.pressed]}><Text style={styles.optText}>{o}</Text></Pressable>)}
        </View>
      </View>
    </PlayScreen>;
  }
  return <ParentArea onBack={onBack} onSignedOut={onSignedOut} />;
}

function ago(at: number, now: number): string {
  const min = Math.round((now - at) / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
}

function ParentArea({ onBack, onSignedOut }: { onBack: () => void; onSignedOut: () => void }) {
  const { account } = useSession();
  const progress = useProgress();
  const [voice, setVoice] = useState<VoiceStatus>("unknown");
  useEffect(() => onVoiceStatus(setVoice), []);
  const now = Date.now();
  const access = account ? accessFor(account.trialStart, now, account.paid) : null;
  const stickers = earnedStickers(progress).length;
  const played = Object.keys(progress.best).length;
  const today = useMemo(() => progress.log.filter((l) => now - l.at < 24 * 3600 * 1000).length, [progress.log, now]);

  const status = !access ? "" : access.plan === "trial" ? `Đang dùng thử đầy đủ · còn ${access.daysLeft} / ${TRIAL_DAYS} ngày`
    : access.plan === "full" ? "Gói đầy đủ" : `Hết ${TRIAL_DAYS} ngày dùng thử · bé chơi được ${FREE_GAME_IDS.length} trò miễn phí`;

  return <PlayScreen>
    <View style={styles.top}>
      <RoundButton kind="back" label="Quay lại" onPress={onBack} />
      <View style={{ flex: 1 }}><Title>Góc phụ huynh</Title><Sub>{account?.email}</Sub></View>
      <Pressable accessibilityRole="button" onPress={() => { signOut(); onSignedOut(); }} style={styles.out}><Text style={styles.outText}>Đăng xuất</Text></Pressable>
    </View>
    <View style={styles.body}>
      <View style={styles.col}>
        <View style={[styles.box, access?.plan === "limited" && styles.boxWarn]}>
          <Text style={styles.boxTitle}>Gói của bé</Text>
          <Text style={styles.boxText}>{status}</Text>
          <Text style={styles.small}>{PRICE_LABEL}</Text>
          <Pressable accessibilityRole="button" onPress={() => previewTrialEnded(access?.plan !== "limited")} style={styles.preview}>
            <Text style={styles.previewText}>{access?.plan === "limited" ? "Bản xem trước: quay lại dùng thử" : "Bản xem trước: xem khi hết 7 ngày"}</Text>
          </Pressable>
        </View>
        {voice === "none" ? <Text style={styles.voiceNote}>Máy này chưa có giọng nữ tiếng Việt nên app đang im lặng.</Text> : null}
        <View style={styles.stats}>
          <Stat n={today} label="lượt chơi hôm nay" />
          <Stat n={played} label="trò đã chơi" />
          <Stat n={stickers} label={`/ ${STICKERS.length} sticker`} />
        </View>
      </View>
      <View style={[styles.box, styles.logBox]}>
        <Text style={styles.boxTitle}>Bé đã chơi gì</Text>
        {progress.log.length === 0 ? <Text style={styles.small}>Chưa có lượt chơi nào. Khi bé chơi xong một trò, trò đó hiện ở đây.</Text> : null}
        <ScrollView>
          {progress.log.slice(0, 40).map((l, i) => <View key={`${l.at}-${i}`} style={styles.logRow}>
            <Text style={styles.logGame} numberOfLines={1}>{findGame(l.gameId)?.title ?? l.gameId}</Text>
            <Text style={styles.logLevel}>Mức {LEVEL_NAMES[l.level]}</Text>
            <Text style={styles.logWhen}>{ago(l.at, now)}</Text>
          </View>)}
        </ScrollView>
      </View>
    </View>
  </PlayScreen>;
}

function Stat({ n, label }: { n: number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statN}>{n}</Text><Text style={styles.statL}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54 },
  gate: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  sum: { ...playType.title, fontSize: 44, color: play.ink },
  opts: { flexDirection: "row", gap: 14 },
  opt: { width: 84, height: 64, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderBottomWidth: 4, borderBottomColor: "#DFE5EF" },
  optText: { ...playType.title, fontSize: 28, color: play.ink },
  out: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: "#FFFFFF", justifyContent: "center" },
  outText: { ...playType.bodyBold, fontSize: 13, color: "#D8434E" },
  body: { flex: 1, flexDirection: "row", gap: 12, marginTop: 6 },
  col: { width: "44%", gap: 10 },
  box: { backgroundColor: play.panel, borderRadius: 20, padding: 12, gap: 4 },
  boxWarn: { borderWidth: 3, borderColor: play.sun },
  boxTitle: { ...playType.title, fontSize: 17, color: play.ink },
  boxText: { ...playType.bodyBold, fontSize: 14, color: play.blue },
  small: { ...playType.body, fontSize: 12, color: play.soft },
  preview: { alignSelf: "flex-start", marginTop: 4, borderRadius: 14, borderWidth: 2, borderColor: "#C7CFE2", borderStyle: "dashed", paddingHorizontal: 10, paddingVertical: 4 },
  previewText: { ...playType.body, fontSize: 11, color: play.soft },
  voiceNote: { ...playType.body, fontSize: 12, color: play.ink, backgroundColor: "#FFF3C4", borderRadius: 12, padding: 8 },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, backgroundColor: play.panel, borderRadius: 18, padding: 8, alignItems: "center" },
  statN: { ...playType.title, fontSize: 26, color: play.leaf },
  statL: { ...playType.body, fontSize: 11, color: play.soft, textAlign: "center" },
  logBox: { flex: 1 },
  logRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#E9EDF5" },
  logGame: { ...playType.bodyBold, flex: 1, fontSize: 13, color: play.ink },
  logLevel: { ...playType.body, fontSize: 12, color: play.blue },
  logWhen: { ...playType.body, fontSize: 11, color: play.soft, width: 90, textAlign: "right" },
  pressed: { transform: [{ scale: 0.96 }] },
});
