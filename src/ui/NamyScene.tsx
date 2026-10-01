import { createContext, useContext, type PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { namyColors } from "./brand-tokens";
import { namyTypography } from "./typography";

type TypographyAudience = "child" | "parent";

const TypographyAudienceContext = createContext<TypographyAudience>("child");

type SceneProps = PropsWithChildren<{
  stateCode: string;
  eyebrow?: string;
  title: string;
  description?: string;
  calm?: boolean;
  scrollEnabled?: boolean;
  minimal?: boolean;
  audience?: TypographyAudience;
}>;

export function NamyScene({ stateCode, eyebrow = "NamyKids", title, description, calm = false, scrollEnabled = true, minimal = false, audience, children }: SceneProps) {
  const resolvedAudience = audience ?? (calm ? "parent" : "child");
  const parentFacing = resolvedAudience === "parent";
  return (
    <TypographyAudienceContext.Provider value={resolvedAudience}>
      <View style={[styles.page, calm && styles.calmPage]}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbOne]} />
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbTwo]} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
          {!minimal ? <View style={styles.topline}>
            <Text style={[styles.brand, parentFacing && styles.parentLabel]}>{eyebrow}</Text>
            <Text style={[styles.state, parentFacing && styles.parentLabel]}>{stateCode}</Text>
          </View> : null}
          <Text accessibilityRole="header" style={[styles.title, parentFacing && styles.parentTitle, minimal && styles.minimalTitle]}>{title}</Text>
          {description ? <Text style={[styles.description, parentFacing && styles.parentBody, minimal && styles.minimalDescription]}>{description}</Text> : null}
          {children}
        </ScrollView>
      </View>
    </TypographyAudienceContext.Provider>
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
  const audience = useContext(TypographyAudienceContext);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, styles[`action${tone}`], disabled && styles.actionDisabled, pressed && !disabled && styles.actionPressed]}
    >
      <Text style={[styles.actionText, audience === "parent" && styles.parentLabel, tone !== "leaf" && styles.actionTextPaper]}>{label}</Text>
    </Pressable>
  );
}

export function SceneText({ children, style }: PropsWithChildren<{ style?: TextStyle }>) {
  const audience = useContext(TypographyAudienceContext);
  return <Text style={[audience === "parent" ? styles.parentBody : styles.childBody, style]}>{children}</Text>;
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
  brand: { ...namyTypography.child.display, color: namyColors.text.primary },
  state: { ...namyTypography.child.caption, color: namyColors.text.secondary },
  title: { ...namyTypography.child.title, color: namyColors.text.primary, marginTop: 22 },
  parentTitle: { ...namyTypography.parent.title },
  minimalTitle: { textAlign: "center", marginTop: 42 },
  description: { ...namyTypography.child.body, color: namyColors.text.secondary, marginTop: 10, maxWidth: 560 },
  childBody: { ...namyTypography.child.body, color: namyColors.text.primary },
  parentBody: { ...namyTypography.parent.body, color: namyColors.text.primary },
  parentLabel: { ...namyTypography.parent.label },
  minimalDescription: { textAlign: "center", alignSelf: "center" },
  card: { backgroundColor: namyColors.surface.raised, borderRadius: 28, padding: 20, marginTop: 20, shadowColor: namyColors.brand.primary, shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 3 },
  action: { minHeight: 52, justifyContent: "center", alignItems: "center", borderRadius: 18, paddingHorizontal: 18, marginTop: 12, borderWidth: 1 },
  actionleaf: { backgroundColor: namyColors.brand.primary, borderColor: namyColors.border.strong },
  actionsun: { backgroundColor: namyColors.brand.accent, borderColor: namyColors.border.strong },
  actionpaper: { backgroundColor: namyColors.surface.raised, borderColor: namyColors.border.default },
  actionDisabled: { opacity: 0.45 },
  actionPressed: { transform: [{ scale: 0.98 }] },
  actionText: { ...namyTypography.child.button, color: namyColors.text.inverse, textAlign: "center" },
  actionTextPaper: { color: namyColors.text.primary },
  assetNotice: { borderRadius: 16, borderWidth: 1, borderColor: namyColors.border.default, backgroundColor: namyColors.surface.subtle, padding: 14, marginTop: 18 },
  assetNoticeCompact: { marginTop: 12, paddingVertical: 8 },
  assetKicker: { ...namyTypography.child.caption, color: namyColors.text.primary },
  assetText: { ...namyTypography.child.caption, color: namyColors.text.secondary, marginTop: 4 }
});

export const sceneStyles = styles;
