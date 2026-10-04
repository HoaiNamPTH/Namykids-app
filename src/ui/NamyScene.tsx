import { createContext, useContext, type PropsWithChildren, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  landscape?: boolean;
  audience?: TypographyAudience;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
}>;

export function NamyScene({ stateCode, eyebrow = "NamyKids", title, description, calm = false, scrollEnabled = true, minimal = false, landscape = false, audience, headerLeft, headerRight, children }: SceneProps) {
  const resolvedAudience = audience ?? (calm ? "parent" : "child");
  const parentFacing = resolvedAudience === "parent";
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const landscapeHorizontalPadding = width >= 1024 ? 48 : width >= 750 ? 24 : 16;
  const landscapeContentWidth = Math.max(0, Math.min(width, 1366) - insets.left - insets.right - (landscapeHorizontalPadding * 2));
  return (
    <TypographyAudienceContext.Provider value={resolvedAudience}>
      <View style={[styles.page, calm && styles.calmPage]}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbOne]} />
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbTwo]} />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            landscape && styles.landscapeContent,
            landscape && {
              paddingLeft: insets.left + landscapeHorizontalPadding,
              paddingRight: insets.right + landscapeHorizontalPadding,
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 16,
              width: landscapeContentWidth,
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
        >
          {!minimal || headerLeft || headerRight ? <View style={[styles.topline, landscape && styles.landscapeTopline]}>
            <View style={styles.headerSlot}>{headerLeft ?? (!minimal ? <Text style={[styles.brand, parentFacing && styles.parentLabel]}>{eyebrow}</Text> : null)}</View>
            {!landscape && !minimal ? <Text style={[styles.state, parentFacing && styles.parentLabel]}>{stateCode}</Text> : null}
            <View style={[styles.headerSlot, styles.headerSlotRight]}>{headerRight}</View>
          </View> : null}
          <Text accessibilityRole="header" style={[styles.title, parentFacing && styles.parentTitle, minimal && styles.minimalTitle, landscape && styles.landscapeTitle]}>{title}</Text>
          {description ? <Text style={[styles.description, parentFacing && styles.parentBody, minimal && styles.minimalDescription, landscape && styles.landscapeDescription]}>{description}</Text> : null}
          {children}
        </ScrollView>
      </View>
    </TypographyAudienceContext.Provider>
  );
}

export function SceneCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SceneAction({ label, onPress, tone = "leaf", disabled = false, accessibilityLabel, accessibilityHint, style }: {
  label: string;
  onPress: () => void;
  tone?: "leaf" | "sun" | "paper";
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const audience = useContext(TypographyAudienceContext);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, styles[`action${tone}`], style, disabled && styles.actionDisabled, pressed && !disabled && styles.actionPressed]}
    >
      <Text style={[styles.actionText, audience === "parent" && styles.parentLabel, tone !== "leaf" && styles.actionTextPaper]}>{label}</Text>
    </Pressable>
  );
}

export function SceneIconAction({ icon, accessibilityLabel, accessibilityHint, onPress, disabled = false, size = 44 }: {
  icon: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconAction,
        { width: size, height: size, borderRadius: size / 2 },
        disabled && styles.actionDisabled,
        pressed && !disabled && styles.iconActionPressed,
      ]}
    >
      <Text accessible={false} style={styles.iconActionGlyph}>{icon}</Text>
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
  page: { flex: 1, overflow: "hidden", backgroundColor: namyColors.surface.base },
  calmPage: { backgroundColor: namyColors.surface.calm },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 36 },
  landscapeContent: { maxWidth: 1366, alignSelf: "center" },
  orb: { position: "absolute", borderRadius: 999, opacity: 0.55 },
  orbOne: { width: 230, height: 230, backgroundColor: namyColors.brand.accent, top: -92, right: -68 },
  orbTwo: { width: 180, height: 180, backgroundColor: namyColors.brand.secondary, bottom: -54, left: -74 },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  landscapeTopline: { minHeight: 50 },
  headerSlot: { flex: 1, alignItems: "flex-start" },
  headerSlotRight: { alignItems: "flex-end" },
  brand: { ...namyTypography.child.display, color: namyColors.text.primary },
  state: { ...namyTypography.child.caption, color: namyColors.text.secondary },
  title: { ...namyTypography.child.title, color: namyColors.text.primary, marginTop: 22 },
  parentTitle: { ...namyTypography.parent.title },
  minimalTitle: { textAlign: "center", marginTop: 42 },
  landscapeTitle: { textAlign: "center", alignSelf: "center", marginTop: 2 },
  description: { ...namyTypography.child.body, color: namyColors.text.secondary, marginTop: 10, maxWidth: 560 },
  childBody: { ...namyTypography.child.body, color: namyColors.text.primary },
  parentBody: { ...namyTypography.parent.body, color: namyColors.text.primary },
  parentLabel: { ...namyTypography.parent.label },
  minimalDescription: { textAlign: "center", alignSelf: "center" },
  landscapeDescription: { textAlign: "center", alignSelf: "center", marginTop: 4, maxWidth: 720 },
  card: { backgroundColor: namyColors.surface.raised, borderRadius: 28, padding: 20, marginTop: 20, shadowColor: namyColors.brand.primary, shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 3 },
  action: { minHeight: 52, justifyContent: "center", alignItems: "center", borderRadius: 18, paddingHorizontal: 18, marginTop: 12, borderWidth: 1 },
  actionleaf: { backgroundColor: namyColors.brand.primary, borderColor: namyColors.border.strong },
  actionsun: { backgroundColor: namyColors.brand.accent, borderColor: namyColors.border.strong },
  actionpaper: { backgroundColor: namyColors.surface.raised, borderColor: namyColors.border.default },
  actionDisabled: { opacity: 0.45 },
  actionPressed: { transform: [{ scale: 0.98 }] },
  actionText: { ...namyTypography.child.button, color: namyColors.text.inverse, textAlign: "center" },
  actionTextPaper: { color: namyColors.text.primary },
  iconAction: { alignItems: "center", justifyContent: "center", backgroundColor: namyColors.surface.raised, borderWidth: 1, borderColor: namyColors.border.default, shadowColor: namyColors.brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  iconActionPressed: { transform: [{ scale: 0.92 }] },
  iconActionGlyph: { fontSize: 22, lineHeight: 26 },
  assetNotice: { borderRadius: 16, borderWidth: 1, borderColor: namyColors.border.default, backgroundColor: namyColors.surface.subtle, padding: 14, marginTop: 18 },
  assetNoticeCompact: { marginTop: 12, paddingVertical: 8 },
  assetKicker: { ...namyTypography.child.caption, color: namyColors.text.primary },
  assetText: { ...namyTypography.child.caption, color: namyColors.text.secondary, marginTop: 4 }
});

export const sceneStyles = styles;
