import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from "react-native";
import { childFacingGlyph } from "../runtime/activity-player/presentation";
import { foundationAssets } from "./foundation-assets";
import { namyTypography } from "./typography";

export const s03ProductionAssets = {
  background: foundationAssets.background,
  nami: foundationAssets.namiGuide,
  panel: foundationAssets.activityPanel,
  tileRed: foundationAssets.tileRed,
  tileGreen: foundationAssets.tileGreen,
  tilePurple: foundationAssets.tilePurple,
  missingSlot: foundationAssets.missingSlot,
  back: foundationAssets.back,
  speaker: foundationAssets.speaker,
} as const;

export function S03LandscapeBackdrop() {
  return <Image
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    resizeMode="cover"
    source={s03ProductionAssets.background}
    style={StyleSheet.absoluteFill}
  />;
}

export function S03RasterIconAction({ source, accessibilityLabel, accessibilityHint, onPress, size }: {
  source: ImageSourcePropType;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  size: number;
}) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    onPress={onPress}
    style={({ pressed }) => [styles.iconAction, { width: size, height: size }, pressed && styles.iconActionPressed]}
  >
    <Image accessible={false} resizeMode="contain" source={source} style={styles.iconImage} />
  </Pressable>;
}

export function S03InstructionContent({ sequence, missingPositions, actionLabel, onStart }: {
  sequence: readonly string[];
  missingPositions: readonly number[];
  actionLabel: string;
  onStart: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const compact = height < 500;
  const horizontalPadding = width >= 1024 ? 96 : width >= 750 ? 48 : 32;
  const contentWidth = Math.max(0, width - horizontalPadding);
  const panelWidth = Math.min(compact ? 660 : 920, contentWidth * (compact ? 0.75 : 0.78));
  const panelHeight = panelWidth * (510 / 1166);
  const tileSize = Math.min(compact ? 82 : 138, panelWidth * 0.156);
  const tileGap = Math.max(5, tileSize * 0.12);
  const mascotHeight = Math.min(panelHeight * 1.26, height * (compact ? 0.65 : 0.64));
  const mascotWidth = mascotHeight * (664 / 929);
  const ctaHeight = compact ? 48 : 76;

  return <View style={[styles.stage, !compact && styles.stageWide]}>
    <View style={[styles.lessonRow, { width: contentWidth, minHeight: mascotHeight }, !compact && styles.lessonRowWide]}> 
      <View style={[styles.panelFrame, { width: panelWidth, height: panelHeight }]}> 
        <Image accessible={false} resizeMode="contain" source={s03ProductionAssets.panel} style={styles.panelImage} />
        <View accessibilityLabel="Dãy chữ theo thứ tự" style={[styles.sequence, { gap: tileGap }]}> 
          {sequence.slice(0, 5).map((glyph, index) => <S03InstructionTile
            key={`${glyph}-${index}`}
            glyph={glyph}
            missing={missingPositions.includes(index)}
            size={tileSize}
          />)}
        </View>
      </View>
      <Image
        testID="nami-instruction-asset-slot"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={s03ProductionAssets.nami}
        style={[styles.nami, { width: mascotWidth, height: mascotHeight, marginLeft: -Math.min(70, panelWidth * 0.08) }, !compact && styles.namiWide]}
      />
    </View>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={actionLabel}
      accessibilityHint="Mở bài học"
      onPress={onStart}
      style={({ pressed }) => [styles.primaryAction, { minHeight: ctaHeight, width: Math.min(compact ? 244 : 350, contentWidth * 0.48) }, pressed && styles.primaryActionPressed]}
    >
      <Text style={[styles.primaryActionText, { fontSize: compact ? 20 : 29 }]}>{actionLabel}</Text>
    </Pressable>
  </View>;
}

function S03InstructionTile({ glyph, missing, size }: { glyph: string; missing: boolean; size: number }) {
  const displayGlyph = childFacingGlyph(glyph);
  const source = missing ? s03ProductionAssets.missingSlot : tileSourceForGlyph(displayGlyph);
  return <View style={[styles.tileFrame, { width: size, height: size }]}> 
    <Image accessible={false} resizeMode="contain" source={source} style={styles.tileImage} />
    <Text accessible={false} style={[styles.tileGlyph, missing ? styles.missingGlyph : tileGlyphColor(displayGlyph), { fontSize: size * (missing ? 0.52 : 0.56), lineHeight: size * 0.62 }]}>{missing ? "?" : displayGlyph}</Text>
  </View>;
}

function tileSourceForGlyph(glyph: string): ImageSourcePropType {
  if (glyph === "C") return s03ProductionAssets.tileGreen;
  if (glyph === "E") return s03ProductionAssets.tilePurple;
  return s03ProductionAssets.tileRed;
}

function tileGlyphColor(glyph: string) {
  if (glyph === "C") return styles.greenGlyph;
  if (glyph === "E") return styles.purpleGlyph;
  return styles.redGlyph;
}

const styles = StyleSheet.create({
  stage: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingBottom: 8 },
  stageWide: { transform: [{ translateY: 42 }] },
  lessonRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  lessonRowWide: { transform: [{ translateX: 60 }] },
  panelFrame: { alignItems: "center", justifyContent: "center" },
  panelImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" },
  sequence: { width: "86%", flexDirection: "row", alignItems: "center", justifyContent: "center" },
  tileFrame: { alignItems: "center", justifyContent: "center" },
  tileImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" },
  tileGlyph: { ...namyTypography.child.button, textAlign: "center", textShadowColor: "#FFF4D8", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  redGlyph: { color: "#F13D43" },
  greenGlyph: { color: "#2DAE59" },
  purpleGlyph: { color: "#A554D5" },
  missingGlyph: { color: "#C79E6D", textShadowColor: "#FFF9E8" },
  nami: { alignSelf: "flex-end", zIndex: 1, transform: [{ translateY: 12 }] },
  namiWide: { transform: [{ translateY: 78 }] },
  primaryAction: { alignItems: "center", justifyContent: "center", marginTop: 8, borderWidth: 5, borderColor: "#FFFDF7", borderRadius: 999, backgroundColor: "#087FF0", shadowColor: "#165FAD", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 9 },
  primaryActionPressed: { transform: [{ scale: 0.98 }] },
  primaryActionText: { ...namyTypography.child.button, color: "#FFFFFF", lineHeight: 34, textAlign: "center" },
  iconAction: { alignItems: "center", justifyContent: "center" },
  iconActionPressed: { transform: [{ scale: 0.92 }] },
  iconImage: { width: "100%", height: "100%" },
});
