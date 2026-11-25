import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { playType } from "../../ui/typography";
import { play } from "../theme";
import { isVoiceOn, setVoiceOn, speak } from "../voice";

/** "Cài đặt âm thanh" from the utility menu (IA v1.1): a small card over the home screen. */
export function SoundSettings({ onClose }: { onClose: () => void }) {
  const [on, setOn] = useState(isVoiceOn());
  const toggle = () => { setVoiceOn(!on); setOn(!on); if (!on) void speak("Giọng hướng dẫn đã bật."); };
  return <View style={styles.shade}>
    <View style={styles.card}>
      <Text style={styles.title}>Cài đặt âm thanh</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Giọng hướng dẫn</Text>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={toggle} style={[styles.switch, on && styles.switchOn]}>
          <View style={[styles.knob, on && styles.knobOn]} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => void speak("Chào con! Hôm nay mình khám phá gì nhỉ?")} style={styles.try}><Text style={styles.tryText}>Nghe thử</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.done}><Text style={styles.doneText}>Xong</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(28,42,90,0.35)", alignItems: "center", justifyContent: "center" },
  card: { width: 320, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 16, gap: 12 },
  title: { ...playType.title, fontSize: 20, color: play.ink },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { ...playType.bodyBold, fontSize: 15, color: play.ink },
  switch: { width: 56, height: 32, borderRadius: 16, backgroundColor: "#D5DBE8", padding: 3 },
  switchOn: { backgroundColor: play.leaf },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#FFFFFF" },
  knobOn: { marginLeft: 24 },
  try: { alignSelf: "flex-start", paddingHorizontal: 14, minHeight: 36, borderRadius: 18, backgroundColor: "#EEF3FF", justifyContent: "center" },
  tryText: { ...playType.bodyBold, fontSize: 14, color: play.blue },
  done: { minHeight: 44, borderRadius: 22, backgroundColor: play.blue, alignItems: "center", justifyContent: "center" },
  doneText: { ...playType.title, fontSize: 17, color: "#FFFFFF" },
});
