import { createContext, useContext, type PropsWithChildren, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
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
  landscapeBackdrop?: ReactNode;
  hideHeading?: boolean;
  audience?: TypographyAudience;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
}>;

export function NamyScene({ stateCode, eyebrow = "NamyKids", title, description, calm = false, scrollEnabled = true, minimal = false, landscape = false, landscapeBackdrop, hideHeading = false, audience, headerLeft, headerRight, children }: SceneProps) {
  const resolvedAudience = audience ?? (calm ? "parent" : "child");
  const parentFacing = resolvedAudience === "parent";
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const landscapeHorizontalPadding = width >= 1024 ? 48 : width >= 750 ? 24 : 16;
  const landscapeContentWidth = Math.max(0, Math.min(width, 1366) - insets.left - insets.right);
  return (
    <TypographyAudienceContext.Provider value={resolvedAudience}>
      <View style={[styles.page, calm && styles.calmPage]}>
        {landscape ? landscapeBackdrop ?? <LandscapeBackdrop /> : <>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbOne]} />
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.orb, styles.orbTwo]} />
        </>}
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
            <View style={styles.headerSlot}>{headerLeft ?? (!minimal && !landscape ? <Text style={[styles.brand, parentFacing && styles.parentLabel]}>{eyebrow}</Text> : null)}</View>
            {!landscape && !minimal ? <Text style={[styles.state, parentFacing && styles.parentLabel]}>{stateCode}</Text> : null}
            <View style={[styles.headerSlot, styles.headerSlotRight]}>{headerRight}</View>
          </View> : null}
          {!hideHeading ? <>
            <Text accessibilityRole="header" style={[styles.title, parentFacing && styles.parentTitle, minimal && styles.minimalTitle, landscape && styles.landscapeTitle]}>{title}</Text>
            {description ? <Text style={[styles.description, parentFacing && styles.parentBody, minimal && styles.minimalDescription, landscape && styles.landscapeDescription]}>{description}</Text> : null}
          </> : null}
          {children}
        </ScrollView>
      </View>
    </TypographyAudienceContext.Provider>
  );
}

function LandscapeBackdrop() {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.landscapeBackdrop}>
    <View style={[styles.skyBase, Platform.OS === "web" && styles.webSkyGradient]} />
    <Cloud style={styles.cloudLeft} />
    <Cloud style={styles.cloudRight} />
    <Cloud style={styles.cloudLow} />
    <View style={[styles.hill, styles.hillFar, Platform.OS === "web" && styles.webMeadowFar]} />
    <View style={[styles.hill, styles.hillBack, Platform.OS === "web" && styles.webMeadowBack]} />
    <View style={[styles.hill, styles.hillFront, Platform.OS === "web" && styles.webMeadowFront]} />
    <Flower style={styles.flowerOne} />
    <Flower style={styles.flowerTwo} />
    <Flower style={styles.flowerThree} />
    <Flower style={styles.flowerFour} />
    <Flower style={styles.flowerFive} />
    <View style={styles.grassClusterLeft} /><View style={styles.grassClusterRight} />
  </View>;
}

function Cloud({ style }: { style: StyleProp<ViewStyle> }) {
  return <View style={[styles.cloud, style]}>
    <View style={styles.cloudShadow} />
    <View style={[styles.cloudPuff, styles.cloudPuffLeft]} />
    <View style={[styles.cloudPuff, styles.cloudPuffCenter]} />
    <View style={[styles.cloudPuff, styles.cloudPuffRight]} />
    <View style={[styles.cloudPuff, styles.cloudPuffTop]} />
  </View>;
}

function Flower({ style }: { style: StyleProp<ViewStyle> }) {
  return <View style={[styles.flower, style]}>
    <View style={[styles.petal, styles.petalTop]} /><View style={[styles.petal, styles.petalLeft]} /><View style={[styles.petal, styles.petalRight]} /><View style={[styles.petal, styles.petalBottom]} /><View style={styles.flowerCenter} />
  </View>;
}

export function SceneCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SceneAction({ label, onPress, tone = "leaf", disabled = false, accessibilityLabel, accessibilityHint, style, labelStyle }: {
  label: string;
  onPress: () => void;
  tone?: "leaf" | "sun" | "paper";
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
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
      <Text style={[styles.actionText, audience === "parent" && styles.parentLabel, tone !== "leaf" && styles.actionTextPaper, labelStyle]}>{label}</Text>
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
      {icon === "🔊" ? <SpeakerGlyph /> : <Text accessible={false} style={styles.iconActionGlyph}>{icon}</Text>}
    </Pressable>
  );
}

function SpeakerGlyph() {
  return <View accessible={false} style={styles.speakerGlyph}>
    <View style={styles.speakerBody} /><View style={styles.speakerHorn} /><View style={[styles.speakerWave, styles.speakerWaveNear]} /><View style={[styles.speakerWave, styles.speakerWaveFar]} />
  </View>;
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
  landscapeBackdrop: { ...StyleSheet.absoluteFill, overflow: "hidden" },
  skyBase: { ...StyleSheet.absoluteFill, backgroundColor: "#86D2F2" },
  webSkyGradient: { backgroundImage: "linear-gradient(112deg, #E8C8DA 0%, #A7DDF3 37%, #7DC9EF 100%)" } as unknown as ViewStyle,
  cloud: { position: "absolute", width: 218, height: 108, opacity: 0.98 },
  cloudLeft: { top: 34, left: "12%", transform: [{ scale: 0.84 }] },
  cloudRight: { top: 26, right: "8%", transform: [{ scale: 1.08 }] },
  cloudLow: { top: "24%", left: -74, transform: [{ scale: 0.9 }], opacity: 0.86 },
  cloudShadow: { position: "absolute", left: 14, right: 8, bottom: 4, height: 42, borderRadius: 999, backgroundColor: "#639FC5", opacity: 0.22, transform: [{ translateY: 8 }] },
  cloudPuff: { position: "absolute", backgroundColor: "#FFFDF7", borderRadius: 999, shadowColor: "#507CA2", shadowOpacity: 0.16, shadowRadius: 13, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  cloudPuffLeft: { width: 82, height: 56, left: 8, bottom: 7 },
  cloudPuffCenter: { width: 104, height: 78, left: 53, bottom: 4 },
  cloudPuffRight: { width: 78, height: 54, right: 6, bottom: 8 },
  cloudPuffTop: { width: 78, height: 58, left: 96, bottom: 31 },
  hill: { position: "absolute", width: "132%", borderRadius: 999, alignSelf: "center" },
  hillFar: { height: "26%", bottom: "3%", backgroundColor: "#B9DC80", opacity: 0.9 },
  hillBack: { height: "34%", bottom: -102, backgroundColor: "#83CA67" },
  hillFront: { height: "31%", bottom: -122, backgroundColor: "#57B85D" },
  webMeadowFar: { backgroundImage: "radial-gradient(ellipse at 50% 0%, #D9EC9F 0%, #B5DD79 56%, #8BCB67 100%)" } as unknown as ViewStyle,
  webMeadowBack: { backgroundImage: "radial-gradient(ellipse at 42% 0%, #9CD573 0%, #72C35F 58%, #57B75A 100%)" } as unknown as ViewStyle,
  webMeadowFront: { backgroundImage: "radial-gradient(ellipse at 50% 0%, #6CC364 0%, #4DAE59 65%, #3F9955 100%)" } as unknown as ViewStyle,
  flower: { position: "absolute", width: 20, height: 20 },
  petal: { position: "absolute", width: 10, height: 10, borderRadius: 999, backgroundColor: "#FFFDF7", borderWidth: 1, borderColor: "#E5D6B9" },
  petalTop: { top: 0, left: 5 }, petalLeft: { top: 5, left: 0 }, petalRight: { top: 5, right: 0 }, petalBottom: { bottom: 0, left: 5 },
  flowerCenter: { position: "absolute", width: 7, height: 7, left: 6.5, top: 6.5, borderRadius: 999, backgroundColor: namyColors.brand.accent },
  flowerOne: { bottom: 27, left: "13%", transform: [{ scale: 1.25 }] },
  flowerTwo: { bottom: 57, left: "24%", transform: [{ scale: 0.8 }] },
  flowerThree: { bottom: 35, right: "17%", transform: [{ scale: 1.1 }] },
  flowerFour: { bottom: 72, right: "10%", transform: [{ scale: 0.72 }] },
  flowerFive: { bottom: 18, right: "5%", transform: [{ scale: 1.35 }] },
  grassClusterLeft: { position: "absolute", width: 112, height: 72, left: 4, bottom: -12, borderRadius: 48, backgroundColor: "#3F9E55", transform: [{ rotate: "-14deg" }] },
  grassClusterRight: { position: "absolute", width: 128, height: 74, right: -12, bottom: -16, borderRadius: 52, backgroundColor: "#439F55", transform: [{ rotate: "12deg" }] },
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
  iconAction: { alignItems: "center", justifyContent: "center", backgroundColor: "#FFFDF9", borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#335779", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 },
  iconActionPressed: { transform: [{ scale: 0.92 }] },
  iconActionGlyph: { color: namyColors.brand.primary, fontSize: 44, lineHeight: 44, marginTop: -5 },
  speakerGlyph: { width: 28, height: 28, position: "relative" },
  speakerBody: { position: "absolute", width: 8, height: 12, left: 1, top: 8, borderRadius: 2, backgroundColor: namyColors.brand.primary },
  speakerHorn: { position: "absolute", width: 14, height: 18, left: 7, top: 5, borderTopRightRadius: 3, borderBottomRightRadius: 3, backgroundColor: namyColors.brand.primary, transform: [{ skewY: "-32deg" }] },
  speakerWave: { position: "absolute", borderColor: namyColors.brand.primary, borderRightWidth: 3, borderTopWidth: 3, borderBottomWidth: 3, borderLeftWidth: 0, borderRadius: 999 },
  speakerWaveNear: { width: 10, height: 17, right: 0, top: 6 },
  speakerWaveFar: { width: 15, height: 25, right: -4, top: 2, opacity: 0.78 },
  assetNotice: { borderRadius: 16, borderWidth: 1, borderColor: namyColors.border.default, backgroundColor: namyColors.surface.subtle, padding: 14, marginTop: 18 },
  assetNoticeCompact: { marginTop: 12, paddingVertical: 8 },
  assetKicker: { ...namyTypography.child.caption, color: namyColors.text.primary },
  assetText: { ...namyTypography.child.caption, color: namyColors.text.secondary, marginTop: 4 }
});

export const sceneStyles = styles;
