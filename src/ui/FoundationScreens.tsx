import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { foundationPreviewPresentation } from "../runtime/activity-player/presentation";
import { namyColors } from "./brand-tokens";
import { foundationAssets } from "./foundation-assets";
import { namyTypography } from "./typography";

type ActionProps = {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FoundationNatureBackdrop() {
  return <Image
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    resizeMode="cover"
    source={foundationAssets.background}
    style={StyleSheet.absoluteFill}
  />;
}

export function FoundationPillAction({ label, onPress, tone = "primary", disabled = false, style }: ActionProps) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.pill, tone === "primary" ? styles.pillPrimary : styles.pillSecondary, style, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
  >
    <Text style={[styles.pillText, tone === "secondary" && styles.pillTextSecondary]}>{label}</Text>
  </Pressable>;
}

export function FoundationCircleAction({ source, label, hint, onPress, size = 58, disabled = false }: {
  source: ImageSourcePropType;
  label: string;
  hint?: string;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
}) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={hint}
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [{ width: size, height: size }, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
  >
    <Image accessible={false} resizeMode="contain" source={source} style={styles.fill} />
  </Pressable>;
}

function FoundationShell({ children, calm = false }: { children: ReactNode; calm?: boolean }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height <= 430;
  return <View style={[styles.page, calm && styles.calmPage]}>
    {!calm ? <FoundationNatureBackdrop /> : <View style={styles.calmGlow} />}
    <View style={[styles.safe, {
      paddingTop: insets.top + (compact ? 8 : 18),
      paddingBottom: insets.bottom + (compact ? 8 : 18),
      paddingLeft: insets.left + (width >= 1024 ? 48 : 20),
      paddingRight: insets.right + (width >= 1024 ? 48 : 20),
    }]}>{children}</View>
  </View>;
}

export function ChildWorldScreen({ onAlphabet, onParent, onRestricted }: { onAlphabet: () => void; onParent: () => void; onRestricted?: () => void }) {
  const { width, height } = useWindowDimensions();
  const compact = height <= 430;
  const horizontalPadding = width >= 1024 ? 96 : 40;
  const mascotWidth = Math.min(width * (compact ? 0.28 : 0.3), 360);
  const cardWidth = Math.min((width - horizontalPadding - mascotWidth - 26) / 2, 350);
  return <FoundationShell>
    <View style={styles.topRight}><FoundationPillAction label="Góc của ba mẹ" onPress={onParent} tone="secondary" style={styles.parentPill} /></View>
    <View style={[styles.worldStage, compact && styles.worldStageCompact]}>
      <View testID="s01-character-asset-slot" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.worldMascotSlot, { width: mascotWidth }]} />
      <View style={styles.worldCopy}>
        <Text accessibilityRole="header" style={[styles.heroTitle, compact && styles.heroTitleCompact]}>Chào con đến với NamyKids</Text>
        <Text style={[styles.heroSubtitle, compact && styles.heroSubtitleCompact]}>Hôm nay con muốn cùng Nami học bài nào?</Text>
        <View style={[styles.subjectRow, compact && styles.subjectRowCompact]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Chữ cái & vần" onPress={onAlphabet} style={({ pressed }) => [styles.subjectCard, compact && styles.subjectCardCompact, { width: cardWidth }, pressed && styles.pressed]}>
            <View style={[styles.subjectTile, compact && styles.subjectTileCompact]}><Image accessible={false} source={foundationAssets.tileRed} style={styles.fill} resizeMode="contain" /><Text style={[styles.subjectGlyph, compact && styles.subjectGlyphCompact]}>A</Text></View>
            <View style={styles.subjectCopy}><Text style={styles.subjectTitle}>Chữ cái & vần</Text><Text style={styles.subjectMeta}>Cùng khám phá chữ cái</Text></View>
            <Text accessible={false} style={styles.subjectArrow}>›</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Số đếm, sắp mở"
            disabled={!onRestricted}
            onPress={onRestricted}
            style={({ pressed }) => [styles.subjectCard, styles.subjectCardMuted, compact && styles.subjectCardCompact, { width: cardWidth }, pressed && onRestricted && styles.pressed]}
          >
            <View style={[styles.subjectTile, styles.numberTile, compact && styles.subjectTileCompact]}><Text style={styles.numberGlyph}>123</Text></View>
            <View style={styles.subjectCopy}><Text style={styles.subjectTitle}>Số đếm</Text><Text style={styles.subjectMeta}>Sắp mở</Text></View>
          </Pressable>
        </View>
      </View>
    </View>
  </FoundationShell>;
}

function JourneyNode({ letter, source, locked = false }: { letter?: string; source?: ImageSourcePropType; locked?: boolean }) {
  return <View style={[styles.journeyNode, locked && styles.journeyNodeLocked]}>
    {source ? <Image accessible={false} source={source} resizeMode="contain" style={styles.fill} /> : null}
    <Text style={[styles.journeyLetter, locked && styles.journeyLetterLocked]}>{locked ? "•" : letter}</Text>
  </View>;
}

export function SubjectJourneyScreen({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const { height } = useWindowDimensions();
  const compact = height <= 430;
  return <FoundationShell>
    <View style={styles.headerRow}>
      <FoundationCircleAction source={foundationAssets.back} label="Quay lại" onPress={onBack} size={compact ? 46 : 60} />
      <View style={styles.centerHeading}><Text accessibilityRole="header" style={[styles.screenTitle, compact && styles.screenTitleCompact]}>Chữ cái & vần</Text><Text style={styles.screenSubtitle}>Mỗi trạm là một trò chơi nhỏ đang chờ con</Text></View>
      <View style={{ width: compact ? 46 : 60 }} />
    </View>
    <View style={[styles.journeyBoard, compact && styles.journeyBoardCompact]}>
      <View style={[styles.pathSegment, styles.pathOne]} /><View style={[styles.pathSegment, styles.pathTwo]} /><View style={[styles.pathSegment, styles.pathThree]} />
      <View style={[styles.nodePosition, styles.nodeA]}><JourneyNode letter="A" source={foundationAssets.tileRed} /></View>
      <View style={[styles.nodePosition, styles.nodeB]}><JourneyNode letter="B" source={foundationAssets.tileGreen} /></View>
      <View style={[styles.nodePosition, styles.nodeC]}><JourneyNode letter="C" source={foundationAssets.tilePurple} /></View>
      <View style={[styles.nodePosition, styles.nodeD]}><JourneyNode locked /></View>
      <View style={[styles.nodePosition, styles.nodeE]}><JourneyNode locked /></View>
    </View>
    <FoundationPillAction label="Bắt đầu chơi" onPress={onStart} style={[styles.centerAction, styles.journeyAction, compact && styles.centerActionCompact]} />
  </FoundationShell>;
}

export function CompletionScreen({ onReplay, onNew, disabled = false }: { onReplay: () => void; onNew: () => void; disabled?: boolean }) {
  const { height } = useWindowDimensions();
  const compact = height <= 430;
  return <FoundationShell>
    <View style={styles.completionStage}>
      <View accessible accessibilityRole="header" accessibilityLabel="Chúc mừng con!" style={[styles.completionBanner, compact && styles.completionBannerCompact]}><Image accessible={false} source={foundationAssets.completionBanner} resizeMode="cover" style={styles.fill} /></View>
      <View style={[styles.celebrationArea, compact && styles.celebrationAreaCompact]}>
        <Text accessible={false} style={[styles.star, styles.starOne]}>★</Text><Text accessible={false} style={[styles.star, styles.starTwo]}>★</Text><Text accessible={false} style={[styles.star, styles.starThree]}>★</Text>
        <View testID="nami-completion-asset-slot" style={styles.celebrationMascotSlot} />
        <View testID="niko-completion-asset-slot" style={styles.celebrationMascotSlot} />
      </View>
      <View style={[styles.actionRow, styles.completionActions]}>
        <FoundationPillAction label="Chơi lại" onPress={onReplay} tone="secondary" disabled={disabled} style={styles.rowAction} />
        <FoundationPillAction label="Chơi mới" onPress={onNew} disabled={disabled} style={styles.rowAction} />
      </View>
    </View>
  </FoundationShell>;
}

function StatusIllustrationSlot({ testID, compact }: { testID: string; compact: boolean }) {
  return <View testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.statusIllustration, compact && styles.statusIllustrationCompact]} />;
}

export function LoadingScreen() {
  const { height } = useWindowDimensions();
  const compact = height <= 430;
  return <FoundationShell>
    <View pointerEvents="none" style={styles.topLeft}><Image accessible={false} source={foundationAssets.back} resizeMode="contain" style={[styles.loadingChrome, compact && styles.loadingChromeCompact]} /></View>
    <View pointerEvents="none" style={styles.topRightChrome}><Image accessible={false} source={foundationAssets.speaker} resizeMode="contain" style={[styles.loadingChrome, compact && styles.loadingChromeCompact]} /></View>
    <View style={styles.statusStage}>
      <View style={[styles.statusCard, styles.loadingCard, compact && styles.statusCardCompact, compact && styles.loadingCardCompact]}>
        <StatusIllustrationSlot testID="s08-loading-asset-slot" compact={compact} />
        <View style={[styles.statusCopy, styles.loadingCopy]}><Text accessibilityRole="header" style={[styles.statusTitle, styles.statusTitleCentered, compact && styles.statusTitleCompact]}>{foundationPreviewPresentation.S08.title}</Text><Text style={[styles.statusDescription, styles.statusDescriptionCentered]}>{foundationPreviewPresentation.S08.description}</Text></View>
      </View>
    </View>
  </FoundationShell>;
}

export function OfflineScreen({ onLesson, onParent }: { onLesson: () => void; onParent: () => void }) {
  return <StatusActionScreen state="offline" title={foundationPreviewPresentation.S09.title} description={foundationPreviewPresentation.S09.description} primaryLabel="Quay lại bài học" onPrimary={onLesson} secondaryLabel="Góc của ba mẹ" onSecondary={onParent} onBack={onLesson} />;
}

export function RestrictedScreen({ onHome }: { onHome: () => void }) {
  return <StatusActionScreen state="restricted" title={foundationPreviewPresentation.S11.title} description={foundationPreviewPresentation.S11.description} primaryLabel="Về trang chủ" onPrimary={onHome} onBack={onHome} />;
}

export function RecoveryScreen({ onHome, onReload }: { onHome: () => void; onReload: () => void }) {
  return <StatusActionScreen state="recovery" title={foundationPreviewPresentation.S12.title} description={foundationPreviewPresentation.S12.description} primaryLabel="Tải lại trang" onPrimary={onReload} secondaryLabel="Về trang chủ" onSecondary={onHome} onBack={onHome} />;
}

function StatusActionScreen({ state, title, description, primaryLabel, onPrimary, secondaryLabel, onSecondary, onBack }: {
  state: "offline" | "restricted" | "recovery";
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBack: () => void;
}) {
  const { height } = useWindowDimensions();
  const compact = height <= 430;
  const recovery = state === "recovery";
  return <FoundationShell>
    <View style={styles.topLeft}><FoundationCircleAction source={foundationAssets.back} label="Quay lại" onPress={onBack} size={compact ? 46 : 60} /></View>
    <View style={styles.statusStage}>
      <View style={[styles.statusCard, compact && styles.statusCardCompact, recovery && styles.recoveryCard]}>
        <View style={[styles.statusCopy, recovery && styles.recoveryCopy]}>
          <Text accessibilityRole="header" style={[styles.statusTitle, compact && styles.statusTitleCompact, recovery && styles.statusTitleCentered]}>{title}</Text>
          <Text style={[styles.statusDescription, recovery && styles.statusDescriptionCentered]}>{description}</Text>
        </View>
        <StatusIllustrationSlot testID={`s-${state}-asset-slot`} compact={compact} />
      </View>
      <View style={[styles.actionRow, styles.statusActions]}>
        {secondaryLabel && onSecondary ? <FoundationPillAction label={secondaryLabel} onPress={onSecondary} tone="secondary" style={styles.rowAction} /> : null}
        <FoundationPillAction label={primaryLabel} onPress={onPrimary} style={styles.rowAction} />
      </View>
    </View>
  </FoundationShell>;
}

export function ParentZoneScreen({ summary, onBack }: { summary: readonly string[]; onBack: () => void }) {
  const { height } = useWindowDimensions();
  const compact = height <= 430;
  const headline = summary[0] ?? "Lượt chơi vừa hoàn thành: 0 ô chữ đã điền đúng.";
  return <FoundationShell calm>
    <View style={styles.topLeft}><FoundationCircleAction source={foundationAssets.back} label="Quay lại" onPress={onBack} size={compact ? 46 : 60} /></View>
    <View style={[styles.parentStage, compact && styles.parentStageCompact]}>
      <View style={styles.parentHeading}><Text accessibilityRole="header" style={[styles.parentTitle, compact && styles.parentTitleCompact]}>Góc của ba mẹ</Text><Text style={[styles.parentDescription, compact && styles.parentDescriptionCompact]}>Theo dõi tiến độ học tập thực tế của bé một cách rõ ràng và chuẩn xác.</Text></View>
      <View style={[styles.parentReport, compact && styles.parentReportCompact]}>
        <View style={[styles.parentColumn, compact && styles.parentColumnCompact]}><Text style={styles.parentLabel}>LƯỢT CHƠI GẦN NHẤT</Text><Text style={[styles.parentHeadline, compact && styles.parentHeadlineCompact]}>{headline}</Text><View testID="s10-parent-character-asset-slot" style={styles.parentMascotSlot} /></View>
        <View style={[styles.parentColumn, compact && styles.parentColumnCompact]}><Text style={styles.parentLabel}>CHI TIẾT</Text>{summary.slice(1).map((line) => <Text key={line} style={[styles.parentDetail, compact && styles.parentDetailCompact]}>{line}</Text>)}</View>
      </View>
      <FoundationPillAction label="Quay lại không gian của bé" onPress={onBack} style={[styles.centerAction, styles.parentAction, compact && styles.parentActionCompact]} />
    </View>
  </FoundationShell>;
}

const styles = StyleSheet.create({
  page: { flex: 1, overflow: "hidden", backgroundColor: "#9DDAF3" },
  calmPage: { backgroundColor: "#F0F0FF" },
  calmGlow: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#F0F0FF" },
  safe: { flex: 1, width: "100%", maxWidth: 1366, alignSelf: "center" },
  fill: { width: "100%", height: "100%" },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.97 }] },
  pill: { minWidth: 190, minHeight: 60, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, borderRadius: 999, borderWidth: 4, shadowColor: "#315A78", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 7 },
  pillPrimary: { backgroundColor: "#3975F6", borderColor: "#FFFDF8" },
  pillSecondary: { backgroundColor: "#FFF7DE", borderColor: "#E3C980" },
  pillText: { ...namyTypography.child.button, color: "#FFFFFF", fontSize: 19, lineHeight: 24, textAlign: "center" },
  pillTextSecondary: { color: namyColors.text.primary },
  topRight: { alignItems: "flex-end", minHeight: 58 },
  topLeft: { position: "absolute", top: 8, left: 20, zIndex: 3 },
  topRightChrome: { position: "absolute", top: 8, right: 20, zIndex: 3 },
  loadingChrome: { width: 60, height: 60, opacity: 0.45 },
  loadingChromeCompact: { width: 46, height: 46 },
  parentPill: { minWidth: 210, minHeight: 58 },
  worldStage: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 22, gap: 26 },
  worldStageCompact: { paddingBottom: 2 },
  worldCopy: { flex: 1, minWidth: 0 },
  heroTitle: { ...namyTypography.child.title, color: namyColors.text.primary, fontSize: 43, lineHeight: 51, maxWidth: 620, textShadowColor: "#FFFFFF", textShadowRadius: 8 },
  heroTitleCompact: { fontSize: 31, lineHeight: 37 },
  heroSubtitle: { ...namyTypography.child.body, color: namyColors.text.primary, fontSize: 20, lineHeight: 28, marginTop: 8 },
  heroSubtitleCompact: { fontSize: 16, lineHeight: 22, marginTop: 2 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 26 },
  subjectRowCompact: { marginTop: 12, gap: 12 },
  subjectCard: { minHeight: 126, borderRadius: 34, padding: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFDF8", borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#315A78", shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 11 }, elevation: 8 },
  subjectCardCompact: { minHeight: 104, borderRadius: 28, padding: 10 },
  subjectCardMuted: { opacity: 0.78, transform: [{ scale: 0.92 }] },
  subjectTile: { width: 94, height: 94, alignItems: "center", justifyContent: "center" },
  subjectTileCompact: { width: 70, height: 70 },
  subjectGlyph: { position: "absolute", ...namyTypography.child.title, color: "#E84045", fontSize: 45, lineHeight: 52 },
  subjectGlyphCompact: { fontSize: 34, lineHeight: 40 },
  numberTile: { borderRadius: 26, backgroundColor: "#FFE7A2", borderWidth: 5, borderColor: "#FFF7DE" },
  numberGlyph: { ...namyTypography.child.button, color: "#E79B00", fontSize: 25 },
  subjectCopy: { flex: 1, marginLeft: 12 },
  subjectTitle: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 21, lineHeight: 27 },
  subjectMeta: { ...namyTypography.child.caption, color: namyColors.text.secondary, marginTop: 4 },
  subjectArrow: { color: namyColors.brand.info, fontSize: 48, lineHeight: 50 },
  worldMascotSlot: { height: "78%", minWidth: 160, maxWidth: 360 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  centerHeading: { flex: 1, alignItems: "center", paddingHorizontal: 12 },
  screenTitle: { ...namyTypography.child.title, color: namyColors.text.primary, fontSize: 39, lineHeight: 46, textAlign: "center", textShadowColor: "#FFFFFF", textShadowRadius: 8 },
  screenTitleCompact: { fontSize: 29, lineHeight: 34 },
  screenSubtitle: { ...namyTypography.child.body, color: namyColors.text.primary, marginTop: 2, textAlign: "center" },
  journeyBoard: { flex: 1, minHeight: 370, marginTop: 6, position: "relative" },
  journeyBoardCompact: { minHeight: 210 },
  pathSegment: { position: "absolute", height: 52, borderRadius: 999, backgroundColor: "#F6DDAE", borderWidth: 9, borderColor: "#FFF3D2", shadowColor: "#75603C", shadowOpacity: 0.2, shadowRadius: 9, elevation: 3 },
  pathOne: { left: "9%", top: "48%", width: "33%", transform: [{ rotate: "-9deg" }] },
  pathTwo: { left: "35%", top: "39%", width: "34%", transform: [{ rotate: "13deg" }] },
  pathThree: { right: "8%", top: "49%", width: "31%", transform: [{ rotate: "-12deg" }] },
  nodePosition: { position: "absolute" },
  nodeA: { left: "8%", top: "38%" }, nodeB: { left: "29%", top: "24%" }, nodeC: { left: "49%", top: "45%" }, nodeD: { right: "25%", top: "28%" }, nodeE: { right: "7%", top: "43%" },
  journeyNode: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  journeyNodeLocked: { width: 82, height: 82, borderRadius: 28, backgroundColor: "#FFF9E9", borderWidth: 6, borderColor: "#E6D3AB", shadowColor: "#6D5A3F", shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  journeyLetter: { position: "absolute", ...namyTypography.child.title, color: "#FFFFFF", fontSize: 46, lineHeight: 52, textShadowColor: "#34256F", textShadowRadius: 3 },
  journeyLetterLocked: { color: "#C8A56C", fontSize: 62 },
  centerAction: { alignSelf: "center", width: 300, minHeight: 72 },
  centerActionCompact: { minHeight: 54, width: 250 },
  journeyAction: { alignSelf: "flex-end", marginRight: "3%" },
  completionStage: { flex: 1, alignItems: "center", justifyContent: "center" },
  completionBanner: { width: 470, height: 104, borderRadius: 42, overflow: "hidden" },
  completionBannerCompact: { width: 340, height: 74, borderRadius: 30 },
  completionTitle: { position: "absolute", top: "11%", ...namyTypography.child.title, color: namyColors.text.primary, fontSize: 39, lineHeight: 46 },
  completionTitleCompact: { top: "7%", fontSize: 29, lineHeight: 34 },
  celebrationArea: { width: "68%", maxWidth: 760, minHeight: 330, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 12 },
  celebrationAreaCompact: { minHeight: 160 },
  celebrationMascotSlot: { width: "34%", height: "86%" },
  star: { position: "absolute", color: "#FFD34E", fontSize: 42, textShadowColor: "#FFF8C9", textShadowRadius: 14 },
  starOne: { left: "9%", top: "22%" }, starTwo: { right: "10%", top: "11%", fontSize: 32 }, starThree: { right: "24%", bottom: "7%", fontSize: 24 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18 },
  completionActions: { width: "100%", maxWidth: 620 },
  rowAction: { flex: 1, minWidth: 0, maxWidth: 290, minHeight: 68 },
  statusStage: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusCard: { width: "88%", maxWidth: 1050, minHeight: 420, borderRadius: 48, backgroundColor: "#FFFDF8", borderWidth: 4, borderColor: "#FFFFFF", shadowColor: "#315A78", shadowOpacity: 0.27, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 10, padding: 38, flexDirection: "row", alignItems: "center" },
  statusCardCompact: { minHeight: 210, padding: 20, borderRadius: 36 },
  loadingCard: { flexDirection: "column", justifyContent: "center" },
  loadingCardCompact: { minHeight: 292, paddingVertical: 16 },
  recoveryCard: { flexDirection: "column", justifyContent: "center" },
  statusIllustration: { width: "38%", height: 300, alignItems: "center", justifyContent: "center" },
  statusIllustrationCompact: { height: 112 },
  statusCopy: { flex: 1, minWidth: 0, paddingHorizontal: 24 },
  loadingCopy: { flex: 0, alignItems: "center" },
  recoveryCopy: { flex: 0, alignItems: "center", maxWidth: 820 },
  statusTitle: { ...namyTypography.child.title, color: namyColors.text.primary, fontSize: 38, lineHeight: 46 },
  statusTitleCompact: { fontSize: 28, lineHeight: 34 },
  statusTitleCentered: { textAlign: "center" },
  statusDescription: { ...namyTypography.child.body, color: namyColors.text.secondary, fontSize: 18, lineHeight: 27, marginTop: 12, maxWidth: 570 },
  statusDescriptionCentered: { textAlign: "center", alignSelf: "center" },
  statusActions: { width: "88%", maxWidth: 760, marginTop: 18 },
  parentStage: { flex: 1, alignItems: "center", justifyContent: "center" },
  parentStageCompact: { justifyContent: "flex-start" },
  parentHeading: { alignItems: "center", maxWidth: 760 },
  parentTitle: { ...namyTypography.parent.title, color: namyColors.text.primary, fontSize: 40, lineHeight: 48 },
  parentTitleCompact: { fontSize: 30, lineHeight: 36 },
  parentDescription: { ...namyTypography.parent.body, color: namyColors.text.secondary, textAlign: "center", marginTop: 6 },
  parentDescriptionCompact: { fontSize: 14, lineHeight: 19, marginTop: 2 },
  parentReport: { width: "88%", maxWidth: 1050, minHeight: 320, marginTop: 26, flexDirection: "row", alignItems: "stretch", gap: 22 },
  parentReportCompact: { minHeight: 150, marginTop: 8, gap: 12 },
  parentColumn: { flex: 1, minWidth: 0, justifyContent: "center", position: "relative", borderRadius: 36, backgroundColor: "#FFFFFF", padding: 30, shadowColor: namyColors.brand.primary, shadowOpacity: 0.13, shadowRadius: 22, elevation: 6 },
  parentColumnCompact: { borderRadius: 26, padding: 16 },
  parentLabel: { ...namyTypography.parent.label, color: namyColors.brand.info },
  parentHeadline: { ...namyTypography.parent.title, color: namyColors.text.primary, fontSize: 25, lineHeight: 34, marginTop: 12, maxWidth: "68%" },
  parentHeadlineCompact: { fontSize: 18, lineHeight: 24, marginTop: 5 },
  parentDetail: { ...namyTypography.parent.body, color: namyColors.text.primary, marginTop: 10 },
  parentDetailCompact: { fontSize: 14, lineHeight: 19, marginTop: 4 },
  parentMascotSlot: { position: "absolute", right: 18, bottom: 14, width: "30%", height: "66%" },
  parentAction: { marginTop: 24, width: 360, minHeight: 68 },
  parentActionCompact: { marginTop: 8, width: 320, minHeight: 54 },
});
