import type { PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { namyColors, namyTypography } from "./brand-tokens";

type SceneProps = PropsWithChildren<{
  stateCode: string;
  eyebrow?: string;
  title: string;
  description?: string;
  calm?: boolean;
  scrollEnabled?: boolean;
  minimal?: boolean;
}>;

export function NamyScene({ stateCode, eyebrow = "NamyKids", title, description, calm = false, scrollEnabled = true, minimal = false, children }: SceneProps) {
  return (
    <View style={[styles.page, calm && styles.calmPage]}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbOne]} />
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbTwo]} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
        {!minimal ? <View style={styles.topline}>
          <Text style={styles.brand}>{eyebrow}</Text>
          <Text style={styles.state}>{stateCode}</Text>
        </View> : null}
        <Text accessibilityRole="header" style={[styles.title, minimal && styles.minimalTitle]}>{title}</Text>
        {description ? <Text style={[styles.description, minimal && styles.minimalDescription]}>{description}</Text> : null}
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
      <Text style={[styles.actionText, tone !== "leaf" && styles.actionTextPaper]}>{label}</Text>
    </Pressable>
  );
}

export function DevAssetNotice({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.assetNotice, compact && styles.assetNoticeCompact]}>
      <Text style={styles.assetKicker}>DEV_PLACEHOLDER / BLOCKED_BY_ASSET</Text>
      {!compact ? <Text style={styles.assetText}>Soft CGI raster và voice asset đã duyệt chưa có trong repo. Không dùng mascot hoặc visual thay thế.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: namyColors.surface.base },
  calmPage: { backgroundColor: namyColors.surface.calm },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 36 },
  orb: { position: "absolute", borderRadius: 999, opacity: 0.55 },
  orbOne: { width: 230, height: 230, backgroundColor: namyColors.brand.accent, top: -92, right: -68 },
  orbTwo: { width: 180, height: 180, backgroundColor: namyColors.brand.secondary, bottom: -54, left: -74 },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: namyColors.text.primary, fontSize: 15, fontWeight: "800", letterSpacing: 0.8, fontFamily: namyTypography.child.display },
  state: { color: namyColors.text.secondary, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: namyColors.text.primary, fontSize: 34, lineHeight: 40, fontWeight: "800", fontFamily: namyTypography.child.title, marginTop: 22 },
  minimalTitle: { textAlign: "center", marginTop: 42 },
  description: { color: namyColors.text.secondary, fontSize: 17, lineHeight: 25, marginTop: 10, maxWidth: 560 },
  minimalDescription: { textAlign: "center", alignSelf: "center" },
  card: { backgroundColor: namyColors.surface.raised, borderRadius: 28, padding: 20, marginTop: 20, shadowColor: namyColors.brand.primary, shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 3 },
  action: { minHeight: 52, justifyContent: "center", alignItems: "center", borderRadius: 18, paddingHorizontal: 18, marginTop: 12, borderWidth: 1 },
  actionleaf: { backgroundColor: namyColors.brand.primary, borderColor: namyColors.border.strong },
  actionsun: { backgroundColor: namyColors.brand.accent, borderColor: namyColors.border.strong },
  actionpaper: { backgroundColor: namyColors.surface.raised, borderColor: namyColors.border.default },
  actionDisabled: { opacity: 0.45 },
  actionPressed: { transform: [{ scale: 0.98 }] },
  actionText: { color: namyColors.text.inverse, fontSize: 17, fontWeight: "800", textAlign: "center" },
  actionTextPaper: { color: namyColors.text.primary },
  assetNotice: { borderRadius: 16, borderWidth: 1, borderColor: namyColors.border.default, backgroundColor: namyColors.surface.subtle, padding: 14, marginTop: 18 },
  assetNoticeCompact: { marginTop: 12, paddingVertical: 8 },
  assetKicker: { color: namyColors.text.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.9 },
  assetText: { color: namyColors.text.secondary, fontSize: 13, lineHeight: 19, marginTop: 4 }
});

export const sceneStyles = styles;
