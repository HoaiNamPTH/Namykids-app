import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { unavailableAudioService, type AudioCue } from "../audio/audio-service";
import { firstSliceDevConfig } from "../content/missing-letters/first-slice-dev-config";
import { isFoundationPreviewEnabled } from "./foundation-preview-guard";
import type { SessionPin } from "../domain/types";
import { e02DragDropEngine, type E02InputMode } from "../engines/e02-drag-drop/contracts";
import { createActivityRound, isPointInsideDropTarget, type DropTargetRect, type RoundItem } from "../runtime/activity-player/activity-round";
import { automaticFeedbackTransition, childCompletionPresentation, foundationParentSummaryCopy, foundationPreviewAccessibility, foundationPreviewPresentation, positionsForCompletionAction, selectedLetterHelper, type PlacementMicroFeedback } from "../runtime/activity-player/presentation";
import { assessRoundPlacement, createRoundAssessment, isHintEligible, revealHintForRound, summarizeRoundAssessment, type RoundAssessmentState } from "../runtime/activity-player/round-assessment";
import { idleGameSession, reduceGameSession } from "../runtime/game-session/reducer";
import { namyColors } from "../ui/brand-tokens";
import { NamyScene, SceneAction, SceneCard } from "../ui/NamyScene";
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
  if (screen === "S03") return renderCanvas(<NamyScene stateCode={s03.stateCode} title={s03.title} description={s03.description}>
    <SceneCard><PreviewSequence sequence={firstSliceDevConfig.visibleSequence} positions={positions} placed={{}} /></SceneCard>
    <SceneAction label={s03.actions[0]} onPress={() => setAudioNotice(s03.audioFallback)} tone="paper" />
    <SceneAction label={s03.actions[1]} onPress={startActivity} tone="leaf" />
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{audioNotice}</Text> : null}
  </NamyScene>);

  if (screen === "S07") return renderCanvas(<NamyScene minimal stateCode="S07" title={childCompletionPresentation.title}>
    <SceneAction label={childCompletionPresentation.actions[0]} onPress={startNewRound} tone="leaf" />
    <SceneAction label={childCompletionPresentation.actions[1]} onPress={replayRound} tone="paper" />
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
  return renderCanvas(<NamyScene scrollEnabled={false} stateCode={s04.stateCode} title={s04.title} description={s04.description}>
    <SceneCard><PreviewSequence sequence={firstSliceDevConfig.visibleSequence} positions={positions} placed={placed} selected={selected?.glyph ?? null} onTargetPress={selectThenPlace} onTargetMeasured={(position, rect) => { targetRects.current = { ...targetRects.current, [position]: rect }; }} /><Text style={styles.helper}>{selected ? selectedLetterHelper(selected.glyph) : s04.idleHelper}</Text></SceneCard>
    {microFeedback ? <View accessibilityLiveRegion="polite" style={[styles.microFeedback, microFeedback.kind === "correct" ? styles.microCorrect : styles.microRetry]}><Text accessible={false} style={styles.microMarker}>{microFeedback.marker === "check" ? "✓" : "↩"}</Text><Text style={styles.microText}>{microFeedback.message}</Text></View> : null}
    <View style={styles.tray}>{round.items.filter((item) => placed[item.position] === undefined).map((item) => <PreviewLetterTile key={item.id} item={item} selected={selectedId === item.id} onPress={() => setSelectedId(item.id)} onDrop={handleDrop} />)}</View>
    <SceneAction label={s04.actions[0]} accessibilityLabel={s04.actions[0]} onPress={revealHint} tone="paper" disabled={!hintEligible} accessibilityHint={hintEligible ? foundationPreviewAccessibility.hintAvailable : foundationPreviewAccessibility.hintUnavailable} />
    <SceneAction label={s04.actions[1]} accessibilityLabel={s04.actions[1]} onPress={refreshRound} tone="paper" disabled={Object.keys(placed).length > 0} accessibilityHint={foundationPreviewAccessibility.refreshHint} />
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

function PreviewSequence({ sequence, positions, placed, selected, onTargetPress, onTargetMeasured }: {
  sequence: readonly string[];
  positions: readonly number[];
  placed: Readonly<Record<number, string>>;
  selected?: string | null;
  onTargetPress?: (position: number) => void;
  onTargetMeasured?: (position: number, rect: DropTargetRect) => void;
}) {
  return <View style={styles.sequence}>{sequence.map((glyph, index) => {
    const missing = positions.includes(index);
    const content = placed[index] ?? (missing ? "?" : glyph);
    return missing
      ? <PreviewTarget key={`${glyph}-${index}`} position={index} content={content} filled={Boolean(placed[index])} selected={selected} onPress={onTargetPress} onMeasured={onTargetMeasured} />
      : <View key={`${glyph}-${index}`} style={styles.glyphCell}><Text style={styles.glyph}>{content}</Text></View>;
  })}</View>;
}

function PreviewTarget({ position, content, filled, selected, onPress, onMeasured }: {
  position: number;
  content: string;
  filled: boolean;
  selected?: string | null;
  onPress?: (position: number) => void;
  onMeasured?: (position: number, rect: DropTargetRect) => void;
}) {
  const targetRef = useRef<View>(null);
  const measureTarget = () => targetRef.current?.measureInWindow((x, y, width, height) => onMeasured?.(position, { x, y, width, height }));
  return <View ref={targetRef} onLayout={measureTarget}><Pressable accessibilityRole="button" accessibilityLabel={`Ô trống ${position + 1}${filled ? ", chữ đã điền đúng" : selected ? `, chạm để đặt chữ ${selected}` : ""}`} accessibilityHint={foundationPreviewAccessibility.dropTargetHint} onPress={() => onPress?.(position)} style={[styles.gap, filled && styles.filledGap]}>{filled ? <Text accessible={false} style={styles.lockMarker}>✓</Text> : null}<Text style={styles.glyph}>{content}</Text></Pressable></View>;
}

function PreviewLetterTile({ item, selected, onPress, onDrop }: { item: RoundItem; selected: boolean; onPress: () => void; onDrop: (itemId: string, point: { x: number; y: number }) => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);
  const gesture = useMemo(() => Gesture.Pan().minDistance(4).onBegin(() => { dragging.value = true; }).onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY; }).onEnd((event) => { runOnJS(onDrop)(item.id, { x: event.absoluteX, y: event.absoluteY }); }).onFinalize(() => { dragging.value = false; translateX.value = withSpring(0); translateY.value = withSpring(0); }), [dragging, item.id, onDrop, translateX, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: dragging.value ? 1.08 : 1 }] }));
  return <GestureDetector gesture={gesture}><Animated.View style={animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={`Kéo chữ ${item.glyph} vào ô trống hoặc chạm để chọn`} accessibilityState={{ selected }} onPress={onPress} style={[styles.tile, selected && styles.tileSelected]}><Text style={styles.tileText}>{item.glyph}</Text></Pressable></Animated.View></GestureDetector>;
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
  sequence: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  glyphCell: { minWidth: 72, minHeight: 72, borderRadius: 18, backgroundColor: namyColors.surface.calm, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: namyColors.border.default },
  gap: { minWidth: 72, minHeight: 72, borderRadius: 18, backgroundColor: namyColors.surface.raised, alignItems: "center", justifyContent: "center", borderWidth: 2, borderStyle: "dashed", borderColor: namyColors.brand.info },
  filledGap: { borderStyle: "solid", backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.border.strong },
  lockMarker: { ...namyTypography.child.button, position: "absolute", top: 4, right: 7, color: namyColors.text.primary, fontSize: 15 },
  glyph: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 16 },
  helper: { ...namyTypography.child.body, color: namyColors.text.primary, fontSize: 15, lineHeight: 22, marginTop: 16, textAlign: "center" },
  tray: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 18 },
  tile: { minHeight: 62, minWidth: 92, borderRadius: 20, backgroundColor: namyColors.brand.accent, borderWidth: 1, borderColor: namyColors.border.strong, justifyContent: "center", alignItems: "center", padding: 12 },
  tileSelected: { backgroundColor: namyColors.brand.info, transform: [{ translateY: -4 }] },
  tileText: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 16 },
  microFeedback: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 9, marginTop: 14 },
  microCorrect: { backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.state.correct },
  microRetry: { backgroundColor: namyColors.state.retrySurface, borderColor: namyColors.state.retry },
  microMarker: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 18 },
  microText: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 15 },
  notice: { ...namyTypography.child.caption, color: namyColors.text.secondary, fontSize: 14, lineHeight: 20, marginTop: 16 },
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
