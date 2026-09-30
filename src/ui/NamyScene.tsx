import type { PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";

type SceneProps = PropsWithChildren<{
  stateCode: string;
  eyebrow?: string;
  title: string;
  description?: string;
  calm?: boolean;
  scrollEnabled?: boolean;
}>;

export function NamyScene({ stateCode, eyebrow = "NamyKids", title, description, calm = false, scrollEnabled = true, children }: SceneProps) {
  return (
    <View style={[styles.page, calm && styles.calmPage]}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbOne]} />
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbTwo]} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
        <View style={styles.topline}>
          <Text style={styles.brand}>{eyebrow}</Text>
          <Text style={styles.state}>{stateCode}</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children}
      </ScrollView>
    </View>
  );
}

export function SceneCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SceneAction({ label, onPress, tone = "leaf", disabled = false, accessibilityHint }: {
  label: string;
  onPress: () => void;
  tone?: "leaf" | "sun" | "paper";
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, styles[`action${tone}`], disabled && styles.actionDisabled, pressed && !disabled && styles.actionPressed]}
    >
      <Text style={[styles.actionText, tone === "paper" && styles.actionTextPaper]}>{label}</Text>
    </Pressable>
  );
}

export function DevAssetNotice({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.assetNotice, compact && styles.assetNoticeCompact]}>
      <Text style={styles.assetKicker}>DEV_PLACEHOLDER ASSETS</Text>
      {!compact ? <Text style={styles.assetText}>Soft CGI raster và voice asset đã duyệt chưa có trong repo. Không dùng mascot hoặc visual thay thế.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#EAF3DE" },
  calmPage: { backgroundColor: "#EEF0E8" },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 36 },
  orb: { position: "absolute", borderRadius: 999, opacity: 0.55 },
  orbOne: { width: 230, height: 230, backgroundColor: "#F6C96B", top: -92, right: -68 },
  orbTwo: { width: 180, height: 180, backgroundColor: "#9AC995", bottom: -54, left: -74 },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: "#235445", fontSize: 15, fontWeight: "800", letterSpacing: 0.8, fontFamily: "Georgia" },
  state: { color: "#786347", fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: "#173E35", fontSize: 34, lineHeight: 40, fontWeight: "800", fontFamily: "Georgia", marginTop: 22 },
  description: { color: "#39584B", fontSize: 17, lineHeight: 25, marginTop: 10, maxWidth: 560 },
  card: { backgroundColor: "#FFFEF6", borderRadius: 28, padding: 20, marginTop: 20, shadowColor: "#1B493C", shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 3 },
  action: { minHeight: 52, justifyContent: "center", alignItems: "center", borderRadius: 18, paddingHorizontal: 18, marginTop: 12, borderWidth: 1 },
  actionleaf: { backgroundColor: "#176A51", borderColor: "#0E543F" },
  actionsun: { backgroundColor: "#F3BE54", borderColor: "#D69C32" },
  actionpaper: { backgroundColor: "#F7F0DF", borderColor: "#D8C9AC" },
  actionDisabled: { opacity: 0.45 },
  actionPressed: { transform: [{ scale: 0.98 }] },
  actionText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", textAlign: "center" },
  actionTextPaper: { color: "#315949" },
  assetNotice: { borderRadius: 16, borderWidth: 1, borderColor: "#C9B996", backgroundColor: "#FBF4E5", padding: 14, marginTop: 18 },
  assetNoticeCompact: { marginTop: 12, paddingVertical: 8 },
  assetKicker: { color: "#765A2E", fontSize: 11, fontWeight: "800", letterSpacing: 0.9 },
  assetText: { color: "#705F45", fontSize: 13, lineHeight: 19, marginTop: 4 }
});

export const sceneStyles = styles;
