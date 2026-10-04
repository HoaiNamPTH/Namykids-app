import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { unavailableAudioService, type AudioCue } from "../audio/audio-service";
import { firstSliceDevConfig } from "../content/missing-letters/first-slice-dev-config";
import { isFoundationPreviewEnabled } from "./foundation-preview-guard";
import type { SessionPin } from "../domain/types";
import { e02DragDropEngine, type E02InputMode } from "../engines/e02-drag-drop/contracts";
import { createActivityRound, isPointInsideDropTarget, type DropTargetRect, type RoundItem } from "../runtime/activity-player/activity-round";
import { automaticFeedbackTransition, childCompletionPresentation, childFacingGlyph, foundationParentSummaryCopy, foundationPreviewAccessibility, foundationPreviewPresentation, landscapeLayoutForWidth, positionsForCompletionAction, selectedLetterHelper, type LandscapeLayout, type PlacementMicroFeedback } from "../runtime/activity-player/presentation";
import { assessRoundPlacement, createRoundAssessment, isHintEligible, revealHintForRound, summarizeRoundAssessment, type RoundAssessmentState } from "../runtime/activity-player/round-assessment";
import { idleGameSession, reduceGameSession } from "../runtime/game-session/reducer";
import { namyColors } from "../ui/brand-tokens";
import { NamyScene, SceneAction, SceneCard, SceneIconAction } from "../ui/NamyScene";
import { namyTypography, namyTypographySource, typographyQaPhrases, vietnameseGlyphCorpus } from "../ui/typography";

type PreviewScreen = "S01" | "S02" | "S03" | "S04" | "S07" | "S08" | "S09" | "S10" | "S11" | "S12" | "T01";
type TargetRects = Readonly<Record<number, DropTargetRect>>;
type PreviewSummary = ReturnType<typeof summarizeRoundAssessment>;

const previewPin: SessionPin = {
  childId: "dev-preview-child",
  activityId: firstSliceDevConfig.activityId,
  activityVersion: firstSliceDevConfig.activityVersion,
  contentReleaseId: firstSliceDevConfig.contentReleaseId,
  nodeVersionId: "dev-preview-node-version",
  engineType: "E02_DRAG_DROP",
  engineVersion: firstSliceDevConfig.engineVersion,
  contentHash: "dev-preview-local-fixture",
};

export function FoundationPreview() {
  const { width } = useWindowDimensions();
  const landscapeLayout = landscapeLayoutForWidth(width);
  const [screen, setScreen] = useState<PreviewScreen>("S01");
  const [session, dispatch] = useReducer(reduceGameSession, idleGameSession);
  const [positions, setPositions] = useState<readonly number[]>(firstSliceDevConfig.missingPositions);
  const [placed, setPlaced] = useState<Readonly<Record<number, string>>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<RoundAssessmentState>(() => createRoundAssessment());
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [microFeedback, setMicroFeedback] = useState<PlacementMicroFeedback | null>(null);
  const targetRects = useRef<TargetRects>({});
  const assessmentRef = useRef(assessment);
  const round = useMemo(() => createActivityRound(firstSliceDevConfig, positions), [positions]);
  const selected = round.items.find((item) => item.id === selectedId) ?? null;
  const allPlaced = positions.every((position) => placed[position] !== undefined);
  const hintEligible = isHintEligible(assessment);
  const summary = summarizeRoundAssessment(assessment);
  const parentSummaryCopy = foundationParentSummaryCopy(summary);

  const updateAssessment = (next: RoundAssessmentState) => {
    assessmentRef.current = next;
    setAssessment(next);
  };

  const resetRound = (nextScreen: PreviewScreen, nextPositions: readonly number[] = firstSliceDevConfig.missingPositions) => {
    targetRects.current = {};
    setPositions([...nextPositions]);
    setPlaced({});
    setSelectedId(null);
    updateAssessment(createRoundAssessment());
    setAudioNotice(null);
    setMicroFeedback(null);
    dispatch({ type: "RESET" });
    setScreen(nextScreen);
  };

  const startActivity = () => {
    dispatch({ type: "START", pin: previewPin });
    dispatch({ type: "START", pin: previewPin });
    setScreen("S04");
  };

  const submitPlacement = (itemId: string, targetPosition: number, inputMode: E02InputMode, answerRevealed = session.assisted) => {
    if (screen !== "S04" || placed[targetPosition]) return;
    setMicroFeedback(null);
    const item = round.items.find((candidate) => candidate.id === itemId);
    const target = round.config.dropTargets.find((candidate) => candidate.position === targetPosition);
    if (!item || !target) return;
    const result = e02DragDropEngine.evaluateDrop(round.config, { trayItemId: item.id, targetId: target.id, inputMode, answerRevealed });
    const assessed = assessRoundPlacement(assessmentRef.current, {
      itemId: item.id,
      targetId: target.id,
      correct: result.correct,
      answerRevealed,
      engineIndependentlyAssessable: result.independentlyAssessable,
    });
    updateAssessment(assessed.state);
    setSelectedId(null);
    dispatch({ type: "ATTEMPT", trayItemId: item.id, targetId: target.id, correct: result.correct, independentlyAssessable: assessed.placement.independentlyAssessable });
    dispatch({ type: "ATTEMPT_EVALUATED" });
    if (result.correct) {
      setPlaced((current) => ({ ...current, [targetPosition]: item.glyph }));
    }
  };

  const selectThenPlace = (targetPosition: number) => {
    if (selected) submitPlacement(selected.id, targetPosition, "select_then_place");
  };

  const handleDrop = (itemId: string, point: { x: number; y: number }) => {
    const targetPosition = positions.find((position) => {
      const target = targetRects.current[position];
      return target ? isPointInsideDropTarget(point, target) : false;
    });
    if (targetPosition !== undefined) submitPlacement(itemId, targetPosition, "drag");
  };

  const revealHint = () => {
    const revealed = revealHintForRound(assessmentRef.current);
    if (revealed === assessmentRef.current) return;
    const next = positions.find((position) => placed[position] === undefined);
    const item = round.items.find((candidate) => candidate.position === next);
    if (next === undefined || !item) return;
    updateAssessment(revealed);
    dispatch({ type: "HINT_USED", answerRevealed: true });
    submitPlacement(item.id, next, "select_then_place", true);
  };

  const playFeedbackCue = useCallback((cue: AudioCue, assetId: string) => {
    return unavailableAudioService.play(cue, assetId);
  }, []);

  const replayInstruction = async () => {
    const result = await unavailableAudioService.play("instruction", firstSliceDevConfig.instructionAudioAssetId);
    if (result === "unavailable") setAudioNotice(foundationPreviewPresentation.S03.audioFallback);
  };

  useEffect(() => {
    const transition = automaticFeedbackTransition(session.phase, allPlaced);
    if (!transition) return;
    if (transition.action === "advance") {
      setMicroFeedback(transition.feedback);
      if (transition.isFinalRound) {
        void playFeedbackCue("correct", firstSliceDevConfig.feedback.correctAudioAssetId)
          .then(() => playFeedbackCue("completion", firstSliceDevConfig.feedback.completionAudioAssetId));
      } else {
        void playFeedbackCue(transition.audioCue, firstSliceDevConfig.feedback.correctAudioAssetId);
      }
      dispatch({ type: "ADVANCE_ROUND", isFinalRound: transition.isFinalRound });
      if (transition.isFinalRound) {
        setScreen("S07");
      }
      return;
    }
    if (transition.action === "request_retry") {
      setMicroFeedback(transition.feedback);
      void playFeedbackCue(transition.audioCue, firstSliceDevConfig.feedback.retryAudioAssetId);
      dispatch({ type: "RETRY_REQUESTED" });
      return;
    }
    dispatch({ type: "START", pin: previewPin });
  }, [allPlaced, playFeedbackCue, session.phase]);

  useEffect(() => {
    if (!microFeedback) return;
    const timer = setTimeout(() => setMicroFeedback(null), 800);
    return () => clearTimeout(timer);
  }, [microFeedback]);

  const refreshRound = () => {
    if (Object.keys(placed).length > 0) return;
    const next = e02DragDropEngine.selectRefreshPositions(firstSliceDevConfig, positions);
    targetRects.current = {};
    setPositions(next);
    setSelectedId(null);
    updateAssessment(createRoundAssessment());
  };

  const startNewRound = () => resetRound("S03", positionsForCompletionAction("Chơi mới", firstSliceDevConfig, positions));
  const replayRound = () => resetRound("S03", positionsForCompletionAction("Chơi lại", firstSliceDevConfig, positions));

  const navigateTo = (nextScreen: PreviewScreen) => {
    if (nextScreen === "S03") {
      resetRound("S03");
      return;
    }
    if (nextScreen === "S04") {
      resetRound("S04");
      dispatch({ type: "START", pin: previewPin });
      dispatch({ type: "START", pin: previewPin });
      return;
    }
    setScreen(nextScreen);
  };

  const renderCanvas = (canvas: ReactNode) => <View style={styles.previewRoot}>
    <View style={styles.previewCanvas}>{canvas}</View>
    {isFoundationPreviewEnabled() ? <DevInspector currentScreen={screen} summary={summary} onNavigate={navigateTo} /> : null}
  </View>;

  const s01 = foundationPreviewPresentation.S01;
  if (screen === "S01") return renderCanvas(<NamyScene stateCode={s01.stateCode} title={s01.title} description={s01.description}>
    <SceneCard><SceneAction label={s01.actions[0]} onPress={() => setScreen("S02")} tone="leaf" /><SceneAction label={s01.actions[1]} onPress={() => setScreen("S10")} tone="paper" /></SceneCard>
  </NamyScene>);

  if (screen === "T01") return renderCanvas(<NamyScene stateCode="TYPE" title="Typography QA tiếng Việt" description="Kiểm tra trực quan dấu tiếng Việt bằng phông chữ hệ thống an toàn.">
    <SceneCard style={styles.typographyCard}>
      {typographyQaPhrases.map((phrase, index) => <Text key={phrase} testID={`typography-qa-phrase-${index + 1}`} style={[styles.typographyPhrase, index === 0 && styles.typographyHeadline, index === 2 && styles.typographyDisplay, (index === 3 || index === 4 || index === 5 || index === 6 || index === 7) && styles.typographyButton, index === 8 && styles.typographyParentTitle, index === 9 && styles.typographyParentBody]}>{phrase}</Text>)}
      <Text testID="typography-qa-glyph-corpus" style={styles.typographyCorpus}>{vietnameseGlyphCorpus}</Text>
    </SceneCard>
  </NamyScene>);

  const s02 = foundationPreviewPresentation.S02;
  if (screen === "S02") return renderCanvas(<NamyScene stateCode={s02.stateCode} title={s02.title} description={s02.description}>
    <SceneCard><SceneAction label={s02.actions[0]} onPress={() => resetRound("S03")} tone="leaf" /><SceneAction label={s02.actions[1]} onPress={() => setScreen("S01")} tone="paper" /></SceneCard>
  </NamyScene>);

  const s03 = foundationPreviewPresentation.S03;
  if (screen === "S03") return renderCanvas(<NamyScene landscape stateCode={s03.stateCode} title={s03.title} description={s03.description} headerRight={<SceneIconAction icon="🔊" accessibilityLabel={foundationPreviewAccessibility.speakerLabel} accessibilityHint={foundationPreviewAccessibility.speakerHint} onPress={() => void replayInstruction()} size={landscapeLayout.controlSize} />}>
    <View style={styles.instructionStage}>
      <SceneCard style={styles.instructionCard}><PreviewSequence layout={landscapeLayout} sequence={firstSliceDevConfig.visibleSequence} positions={positions} placed={{}} /></SceneCard>
      <SceneAction label={s03.primaryAction} onPress={startActivity} tone="leaf" style={[styles.primaryAction, { minHeight: landscapeLayout.primaryActionHeight }]} />
    </View>
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{audioNotice}</Text> : null}
  </NamyScene>);

  if (screen === "S07") return renderCanvas(<NamyScene landscape minimal stateCode="S07" title={childCompletionPresentation.title}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.completionGlow}><Text style={styles.completionStars}>★ ✦ ★</Text></View>
    <View style={styles.completionActions}>
      <SceneAction label={childCompletionPresentation.actions[1]} onPress={replayRound} tone="paper" style={styles.completionAction} />
      <SceneAction label={childCompletionPresentation.actions[0]} onPress={startNewRound} tone="leaf" style={styles.completionAction} />
    </View>
  </NamyScene>);

  const s08 = foundationPreviewPresentation.S08;
  if (screen === "S08") return renderCanvas(<NamyScene stateCode={s08.stateCode} title={s08.title} description={s08.description} />);

  const s09 = foundationPreviewPresentation.S09;
  if (screen === "S09") return renderCanvas(<NamyScene stateCode={s09.stateCode} title={s09.title} description={s09.description}>
    <SceneCard><SceneAction label={s09.actions[0]} onPress={() => setScreen("S04")} tone="leaf" /><SceneAction label={s09.actions[1]} onPress={() => setScreen("S10")} tone="paper" /></SceneCard>
  </NamyScene>);

  const s10 = foundationPreviewPresentation.S10;
  if (screen === "S10") return renderCanvas(<NamyScene calm stateCode={s10.stateCode} eyebrow={s10.eyebrow} title={s10.title} description={s10.description}>
    <SceneCard><Text style={styles.parentSummary}>{parentSummaryCopy[0]}</Text>{parentSummaryCopy.slice(1).map((line) => <Text key={line} style={styles.parentDetail}>{line}</Text>)}<SceneAction label={s10.action} onPress={() => setScreen("S01")} tone="leaf" /></SceneCard>
  </NamyScene>);

  const s11 = foundationPreviewPresentation.S11;
  if (screen === "S11") return renderCanvas(<NamyScene stateCode={s11.stateCode} title={s11.title} description={s11.description}>
    <SceneCard><SceneAction label={s11.action} onPress={() => setScreen("S01")} tone="leaf" /></SceneCard>
  </NamyScene>);

  const s12 = foundationPreviewPresentation.S12;
  if (screen === "S12") return renderCanvas(<NamyScene stateCode={s12.stateCode} title={s12.title} description={s12.description}>
    <SceneCard><SceneAction label={s12.actions[0]} onPress={() => resetRound("S01")} tone="leaf" /><SceneAction label={s12.actions[1]} onPress={() => setScreen("S01")} tone="paper" /></SceneCard>
  </NamyScene>);

  const s04 = foundationPreviewPresentation.S04;
  return renderCanvas(<NamyScene landscape scrollEnabled={false} stateCode={s04.stateCode} title={s04.title} description={s04.description} headerRight={<SceneIconAction icon="🔊" accessibilityLabel={foundationPreviewAccessibility.speakerLabel} accessibilityHint={foundationPreviewAccessibility.speakerHint} onPress={() => void replayInstruction()} size={landscapeLayout.controlSize} />}>
    <View style={[styles.activityStage, { gap: landscapeLayout.activityGap }]}>
      <SceneCard style={styles.activityBoard}><PreviewSequence layout={landscapeLayout} sequence={firstSliceDevConfig.visibleSequence} positions={positions} placed={placed} selected={selected?.glyph ?? null} onTargetPress={selectThenPlace} onTargetMeasured={(position, rect) => { targetRects.current = { ...targetRects.current, [position]: rect }; }} /></SceneCard>
      <View style={styles.feedbackSlot}>{microFeedback ? <View accessibilityLiveRegion="polite" style={[styles.microFeedback, microFeedback.kind === "correct" ? styles.microCorrect : styles.microRetry]}><Text accessible={false} style={styles.microMarker}>{microFeedback.marker === "check" ? "✓" : "↩"}</Text><Text style={styles.microText}>{microFeedback.message}</Text></View> : null}</View>
      <View style={styles.activityLowerRow}>
        <View style={[styles.tray, { gap: landscapeLayout.trayGap }]}>{round.items.filter((item) => placed[item.position] === undefined).map((item) => <PreviewLetterTile key={item.id} layout={landscapeLayout} item={item} selected={selectedId === item.id} onPress={() => setSelectedId(item.id)} onDrop={handleDrop} />)}</View>
        <View style={styles.compactControls}>
          <SceneIconAction icon="💡" accessibilityLabel={s04.actions[0]} onPress={revealHint} disabled={!hintEligible} accessibilityHint={hintEligible ? foundationPreviewAccessibility.hintAvailable : foundationPreviewAccessibility.hintUnavailable} size={landscapeLayout.controlSize} />
          <SceneIconAction icon="↻" accessibilityLabel={s04.actions[1]} onPress={refreshRound} disabled={Object.keys(placed).length > 0} accessibilityHint={foundationPreviewAccessibility.refreshHint} size={landscapeLayout.controlSize} />
        </View>
      </View>
      <Text style={styles.helper}>{selected ? selectedLetterHelper(selected.glyph) : s04.idleHelper}</Text>
    </View>
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{audioNotice}</Text> : null}
  </NamyScene>);
}

const inspectorDestinations: readonly { screen: PreviewScreen; label: string }[] = [
  { screen: "S01", label: "S01" }, { screen: "S02", label: "S02" }, { screen: "S03", label: "S03" },
  { screen: "S04", label: "S04" }, { screen: "S07", label: "S07" }, { screen: "S08", label: "S08" },
  { screen: "S09", label: "S09" }, { screen: "S10", label: "S10" }, { screen: "T01", label: "Typography QA" },
  { screen: "S11", label: "Restricted" }, { screen: "S12", label: "Recovery" },
];

function DevInspector({ currentScreen, summary, onNavigate }: { currentScreen: PreviewScreen; summary: PreviewSummary; onNavigate: (screen: PreviewScreen) => void }) {
  return <View accessibilityLabel="Bảng kiểm tra dành cho nhà phát triển" style={styles.inspector}>
    <Text style={styles.inspectorTitle}>DEV INSPECTOR • PREVIEW HARNESS</Text>
    <Text style={styles.inspectorText}>Màn hình: {currentScreen} | Động cơ: E02 | Dữ liệu: In-Memory</Text>
    <Text style={styles.inspectorText}>Độc lập: {summary.independentCorrectPlacements} • Thử-sai: {summary.trialAndErrorCorrectPlacements} • Có hỗ trợ: {summary.assistedCorrectPlacements}</Text>
    <Text style={styles.inspectorText}>Font: {namyTypographySource.activeFamily} | Asset: DEV_PLACEHOLDER</Text>
    <View style={styles.inspectorNav}>{inspectorDestinations.map((destination) => <Pressable key={destination.screen} accessibilityRole="button" accessibilityLabel={`Mở màn kiểm tra ${destination.label}`} onPress={() => onNavigate(destination.screen)} style={[styles.inspectorPill, currentScreen === destination.screen && styles.inspectorPillActive]}><Text style={styles.inspectorPillText}>{destination.label}</Text></Pressable>)}</View>
  </View>;
}

function PreviewSequence({ layout, sequence, positions, placed, selected, onTargetPress, onTargetMeasured }: {
  layout: LandscapeLayout;
  sequence: readonly string[];
  positions: readonly number[];
  placed: Readonly<Record<number, string>>;
  selected?: string | null;
  onTargetPress?: (position: number) => void;
  onTargetMeasured?: (position: number, rect: DropTargetRect) => void;
}) {
  return <View style={[styles.sequence, { gap: layout.targetGap }]}>{sequence.map((glyph, index) => {
    const missing = positions.includes(index);
    const content = placed[index] ?? (missing ? "?" : glyph);
    return missing
      ? <PreviewTarget key={`${glyph}-${index}`} layout={layout} position={index} content={content} filled={Boolean(placed[index])} selected={selected} onPress={onTargetPress} onMeasured={onTargetMeasured} />
      : <View key={`${glyph}-${index}`} style={[styles.glyphCell, { width: layout.targetSize, height: layout.targetSize, borderRadius: layout.targetRadius }]}><Text style={[styles.glyph, { fontSize: layout.glyphSize }]}>{childFacingGlyph(content)}</Text></View>;
  })}</View>;
}

function PreviewTarget({ layout, position, content, filled, selected, onPress, onMeasured }: {
  layout: LandscapeLayout;
  position: number;
  content: string;
  filled: boolean;
  selected?: string | null;
  onPress?: (position: number) => void;
  onMeasured?: (position: number, rect: DropTargetRect) => void;
}) {
  const targetRef = useRef<View>(null);
  const measureTarget = () => targetRef.current?.measureInWindow((x, y, width, height) => onMeasured?.(position, { x, y, width, height }));
  return <View ref={targetRef} onLayout={measureTarget}><Pressable accessibilityRole="button" accessibilityLabel={`Ô trống ${position + 1}${filled ? ", chữ đã điền đúng" : selected ? `, chạm để đặt chữ ${childFacingGlyph(selected)}` : ""}`} accessibilityHint={foundationPreviewAccessibility.dropTargetHint} onPress={() => onPress?.(position)} style={[styles.gap, { width: layout.targetSize, height: layout.targetSize, borderRadius: layout.targetRadius }, filled && styles.filledGap]}>{filled ? <Text accessible={false} style={styles.lockMarker}>✓</Text> : null}<Text style={[styles.glyph, { fontSize: layout.glyphSize }]}>{childFacingGlyph(content)}</Text></Pressable></View>;
}

function PreviewLetterTile({ layout, item, selected, onPress, onDrop }: { layout: LandscapeLayout; item: RoundItem; selected: boolean; onPress: () => void; onDrop: (itemId: string, point: { x: number; y: number }) => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);
  const gesture = useMemo(() => Gesture.Pan().minDistance(4).onBegin(() => { dragging.value = true; }).onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY; }).onEnd((event) => { runOnJS(onDrop)(item.id, { x: event.absoluteX, y: event.absoluteY }); }).onFinalize(() => { dragging.value = false; translateX.value = withSpring(0); translateY.value = withSpring(0); }), [dragging, item.id, onDrop, translateX, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: dragging.value ? 1.08 : 1 }] }));
  const displayGlyph = childFacingGlyph(item.glyph);
  return <GestureDetector gesture={gesture}><Animated.View style={animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={`Kéo chữ ${displayGlyph} vào ô trống hoặc chạm để chọn`} accessibilityState={{ selected }} onPress={onPress} style={[styles.tile, { width: layout.trayWidth, height: layout.trayHeight, borderRadius: layout.trayRadius }, selected && styles.tileSelected]}><Text style={[styles.tileText, { fontSize: layout.glyphSize }]}>{displayGlyph}</Text></Pressable></Animated.View></GestureDetector>;
}

const styles = StyleSheet.create({
  previewRoot: { flex: 1, backgroundColor: "#1B1736" },
  previewCanvas: { flex: 1, minHeight: 0 },
  typographyCard: { gap: 12 },
  typographyPhrase: { ...namyTypography.child.body, color: namyColors.text.primary },
  typographyHeadline: { ...namyTypography.child.title },
  typographyDisplay: { ...namyTypography.child.display },
  typographyButton: { ...namyTypography.child.button },
  typographyParentTitle: { ...namyTypography.parent.title },
  typographyParentBody: { ...namyTypography.parent.body },
  typographyCorpus: { ...namyTypography.child.body, color: namyColors.text.primary, marginTop: 8 },
  instructionStage: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%" },
  instructionCard: { width: "100%", maxWidth: 880, paddingHorizontal: 28, paddingVertical: 22 },
  primaryAction: { width: "100%", maxWidth: 320, borderRadius: 999, marginTop: 18 },
  activityStage: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%", minHeight: 0 },
  activityBoard: { width: "100%", maxWidth: 920, paddingHorizontal: 20, paddingVertical: 14, marginTop: 8 },
  activityLowerRow: { width: "100%", maxWidth: 920, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  compactControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  sequence: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  glyphCell: { backgroundColor: namyColors.surface.calm, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: namyColors.border.default, shadowColor: namyColors.brand.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  gap: { backgroundColor: namyColors.surface.raised, alignItems: "center", justifyContent: "center", borderWidth: 2, borderStyle: "dashed", borderColor: namyColors.brand.info },
  filledGap: { borderStyle: "solid", backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.border.strong },
  lockMarker: { ...namyTypography.child.button, position: "absolute", top: 4, right: 7, color: namyColors.text.primary, fontSize: 15 },
  glyph: { ...namyTypography.child.button, color: namyColors.text.primary },
  helper: { ...namyTypography.child.caption, color: namyColors.text.secondary, fontSize: 13, lineHeight: 18, textAlign: "center" },
  tray: { flex: 1, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center" },
  tile: { backgroundColor: namyColors.brand.accent, borderWidth: 1, borderColor: namyColors.border.strong, justifyContent: "center", alignItems: "center", shadowColor: namyColors.brand.primary, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
  tileSelected: { backgroundColor: namyColors.brand.info, transform: [{ translateY: -4 }] },
  tileText: { ...namyTypography.child.button, color: namyColors.text.primary },
  feedbackSlot: { minHeight: 42, justifyContent: "center" },
  microFeedback: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 7 },
  microCorrect: { backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.state.correct },
  microRetry: { backgroundColor: namyColors.state.retrySurface, borderColor: namyColors.state.retry },
  microMarker: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 18 },
  microText: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 15 },
  notice: { ...namyTypography.child.caption, color: namyColors.text.secondary, fontSize: 13, lineHeight: 18, marginTop: 8, textAlign: "center" },
  completionGlow: { alignSelf: "center", width: "72%", maxWidth: 620, minHeight: 120, marginTop: 12, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: namyColors.surface.subtle, shadowColor: namyColors.brand.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 28, elevation: 3 },
  completionStars: { ...namyTypography.child.display, color: namyColors.brand.accent, fontSize: 36 },
  completionActions: { flexDirection: "row", alignSelf: "center", width: "100%", maxWidth: 640, gap: 16, marginTop: 14 },
  completionAction: { flex: 1, borderRadius: 999 },
  parentSummary: { ...namyTypography.parent.body, color: namyColors.text.primary },
  parentDetail: { ...namyTypography.parent.body, color: namyColors.text.primary, marginTop: 8 },
  inspector: { backgroundColor: "#1B1736", borderTopWidth: 1, borderColor: "#3D3766", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  inspectorTitle: { ...namyTypography.child.caption, color: "#FFFFFF" },
  inspectorText: { ...namyTypography.child.caption, color: "#D8D4F0", fontSize: 11, lineHeight: 16, marginTop: 2 },
  inspectorNav: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  inspectorPill: { borderWidth: 1, borderColor: "#615A91", backgroundColor: "#292347", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  inspectorPillActive: { borderColor: namyColors.brand.accent, backgroundColor: "#3D3766" },
  inspectorPillText: { ...namyTypography.child.caption, color: "#FFFFFF", fontSize: 11, lineHeight: 15 },
});
