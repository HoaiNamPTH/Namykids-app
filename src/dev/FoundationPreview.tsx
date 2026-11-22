import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { unavailableAudioService, type AudioCue } from "../audio/audio-service";
import { firstSliceDevConfig } from "../content/missing-letters/first-slice-dev-config";
import type { SessionPin } from "../domain/types";
import { e02DragDropEngine, type E02InputMode } from "../engines/e02-drag-drop/contracts";
import { createActivityRound, isPointInsideDropTarget, type DropTargetRect, type RoundItem } from "../runtime/activity-player/activity-round";
import { automaticFeedbackTransition, childFacingGlyph, foundationParentSummaryCopy, foundationPreviewAccessibility, foundationPreviewPresentation, landscapeGlyphTone, landscapeLayoutForWidth, positionsForCompletionAction, selectedLetterHelper, type LandscapeLayout, type PlacementMicroFeedback } from "../runtime/activity-player/presentation";
import { assessRoundPlacement, createRoundAssessment, isHintEligible, revealHintForRound, summarizeRoundAssessment, type RoundAssessmentState } from "../runtime/activity-player/round-assessment";
import { idleGameSession, reduceGameSession } from "../runtime/game-session/reducer";
import { namyColors } from "../ui/brand-tokens";
import { ChildWorldScreen, CompletionScreen, FoundationCircleAction, LoadingScreen, OfflineScreen, ParentZoneScreen, RecoveryScreen, RestrictedScreen, SubjectJourneyScreen } from "../ui/FoundationScreens";
import { foundationAssets } from "../ui/foundation-assets";
import { NamyScene, SceneCard } from "../ui/NamyScene";
import { S03InstructionContent, S03LandscapeBackdrop, S03RasterIconAction, s03ProductionAssets } from "../ui/S03ProductionAssets";
import { namyTypography, typographyQaPhrases, vietnameseGlyphCorpus } from "../ui/typography";

type PreviewScreen = "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07" | "S08" | "S09" | "S10" | "S11" | "S12" | "T01";
type TargetRects = Readonly<Record<number, DropTargetRect>>;

const previewScreens: readonly PreviewScreen[] = ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "T01"];

function initialPreviewScreen(): PreviewScreen {
  if (typeof globalThis.location === "undefined") return "S01";
  const requested = new URLSearchParams(globalThis.location.search).get("screen") as PreviewScreen | null;
  return requested && previewScreens.includes(requested) ? requested : "S01";
}

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
  const { width, height } = useWindowDimensions();
  const landscapeLayout = landscapeLayoutForWidth(width);
  const compactLandscape = height <= 430;
  const [screen, setScreen] = useState<PreviewScreen>(initialPreviewScreen);
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
  const previewCorrectItem = round.items.find((item) => item.position === positions[0]);
  const displayPlaced = screen === "S05" && previewCorrectItem
    ? { ...placed, [previewCorrectItem.position]: previewCorrectItem.glyph }
    : placed;
  const displayFeedback: PlacementMicroFeedback | null = screen === "S05"
    ? { kind: "correct", marker: "check", message: "Con làm đúng rồi" }
    : screen === "S06"
      ? { kind: "retry", marker: "return", message: "Con thử lại nhé" }
      : microFeedback;
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
    if (screen !== "S04" || session.phase !== "IDLE") return;
    dispatch({ type: "START", pin: previewPin });
    dispatch({ type: "START", pin: previewPin });
  }, [screen, session.phase]);

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

  const renderCanvas = (canvas: ReactNode) => <View style={styles.previewRoot}><View style={styles.previewCanvas}>{canvas}</View></View>;

  if (screen === "S01") return renderCanvas(<ChildWorldScreen onAlphabet={() => setScreen("S02")} onParent={() => setScreen("S10")} />);

  if (screen === "T01") return renderCanvas(<NamyScene stateCode="TYPE" title="Typography QA tiếng Việt" description="Kiểm tra trực quan dấu tiếng Việt bằng phông chữ hệ thống an toàn.">
    <SceneCard style={styles.typographyCard}>
      {typographyQaPhrases.map((phrase, index) => <Text key={phrase} testID={`typography-qa-phrase-${index + 1}`} style={[styles.typographyPhrase, index === 0 && styles.typographyHeadline, index === 2 && styles.typographyDisplay, (index === 3 || index === 4 || index === 5 || index === 6 || index === 7) && styles.typographyButton, index === 8 && styles.typographyParentTitle, index === 9 && styles.typographyParentBody]}>{phrase}</Text>)}
      <Text testID="typography-qa-glyph-corpus" style={styles.typographyCorpus}>{vietnameseGlyphCorpus}</Text>
    </SceneCard>
  </NamyScene>);

  if (screen === "S02") return renderCanvas(<SubjectJourneyScreen onBack={() => setScreen("S01")} onStart={() => resetRound("S03")} />);

  const s03 = foundationPreviewPresentation.S03;
  if (screen === "S03") return renderCanvas(<NamyScene key="preview-s03" landscape landscapeBackdrop={<S03LandscapeBackdrop />} hideHeading stateCode={s03.stateCode} title={s03.title} description={s03.description} headerLeft={<S03RasterIconAction source={s03ProductionAssets.back} accessibilityLabel={foundationPreviewAccessibility.backLabel} accessibilityHint={foundationPreviewAccessibility.backHint} onPress={() => setScreen("S02")} size={landscapeLayout.controlSize} />} headerRight={<S03RasterIconAction source={s03ProductionAssets.speaker} accessibilityLabel={foundationPreviewAccessibility.speakerLabel} accessibilityHint={foundationPreviewAccessibility.speakerHint} onPress={() => void replayInstruction()} size={landscapeLayout.controlSize} />}>
    <S03InstructionContent sequence={firstSliceDevConfig.visibleSequence} missingPositions={positions} actionLabel={s03.primaryAction} onStart={startActivity} />
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{audioNotice}</Text> : null}
  </NamyScene>);

  if (screen === "S07") return renderCanvas(<CompletionScreen onReplay={replayRound} onNew={startNewRound} />);

  if (screen === "S08") return renderCanvas(<LoadingScreen />);

  if (screen === "S09") return renderCanvas(<OfflineScreen onLesson={() => setScreen("S04")} onParent={() => setScreen("S10")} />);

  if (screen === "S10") return renderCanvas(<ParentZoneScreen summary={parentSummaryCopy} onBack={() => setScreen("S01")} />);

  if (screen === "S11") return renderCanvas(<RestrictedScreen onHome={() => setScreen("S01")} />);

  if (screen === "S12") return renderCanvas(<RecoveryScreen onReload={() => resetRound("S01")} onHome={() => setScreen("S01")} />);

  const s04 = foundationPreviewPresentation.S04;
  return renderCanvas(<NamyScene key="preview-s04" landscape landscapeBackdrop={<S03LandscapeBackdrop />} hideHeading scrollEnabled={false} stateCode={s04.stateCode} title={s04.title} description={s04.description} headerLeft={<FoundationCircleAction source={foundationAssets.back} label={foundationPreviewAccessibility.backLabel} hint={foundationPreviewAccessibility.backHint} onPress={() => resetRound("S03")} size={landscapeLayout.controlSize} />} headerRight={<FoundationCircleAction source={foundationAssets.speaker} label={foundationPreviewAccessibility.speakerLabel} hint={foundationPreviewAccessibility.speakerHint} onPress={() => void replayInstruction()} size={landscapeLayout.controlSize} />}>
    <View style={[styles.activityStage, { gap: compactLandscape ? 4 : landscapeLayout.activityGap }]}>
      <View style={[styles.activityBoard, compactLandscape && styles.activityBoardCompact]}><Image accessible={false} source={foundationAssets.activityPanel} resizeMode="stretch" style={styles.rasterFill} /><PreviewSequence layout={landscapeLayout} sequence={firstSliceDevConfig.visibleSequence} positions={positions} placed={displayPlaced} selected={selected?.glyph ?? null} onTargetPress={selectThenPlace} onTargetMeasured={(position, rect) => { targetRects.current = { ...targetRects.current, [position]: rect }; }} /></View>
      <View style={[styles.feedbackSlot, compactLandscape && styles.feedbackSlotCompact]}>{displayFeedback ? <View accessible accessibilityRole="text" accessibilityLabel={`${displayFeedback.marker === "check" ? "✓ " : "↩ "}${displayFeedback.message}`} accessibilityLiveRegion="polite" style={[styles.microFeedback, compactLandscape && styles.microFeedbackCompact]}><Image accessible={false} source={displayFeedback.kind === "correct" ? foundationAssets.feedbackCorrect : foundationAssets.feedbackRetry} resizeMode="stretch" style={styles.rasterFill} /></View> : null}</View>
      <View style={styles.activityLowerRow}>
        <Image testID="nami-active-asset-slot" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" source={foundationAssets.namiGuide} resizeMode="contain" style={[styles.activeMascotSlot, compactLandscape && styles.activeMascotSlotCompact]} />
        <View style={[styles.trayBoard, compactLandscape && styles.trayBoardCompact]}><View style={[styles.tray, { gap: landscapeLayout.trayGap }]}>{round.items.filter((item) => displayPlaced[item.position] === undefined).map((item) => <PreviewLetterTile key={item.id} layout={landscapeLayout} item={item} selected={selectedId === item.id} onPress={() => setSelectedId(item.id)} onDrop={handleDrop} />)}</View></View>
        <View style={styles.compactControls}>
          <FoundationCircleAction source={foundationAssets.hint} label={s04.actions[0]} onPress={revealHint} disabled={!hintEligible} hint={hintEligible ? foundationPreviewAccessibility.hintAvailable : foundationPreviewAccessibility.hintUnavailable} size={landscapeLayout.controlSize} />
          <FoundationCircleAction source={foundationAssets.refresh} label={s04.actions[1]} onPress={refreshRound} disabled={Object.keys(placed).length > 0} hint={foundationPreviewAccessibility.refreshHint} size={landscapeLayout.controlSize} />
        </View>
      </View>
      {!compactLandscape ? <Text style={styles.helper}>{selected ? selectedLetterHelper(selected.glyph) : s04.idleHelper}</Text> : null}
    </View>
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{audioNotice}</Text> : null}
  </NamyScene>);
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
      : <View key={`${glyph}-${index}`} style={[styles.glyphCell, { width: layout.targetSize, height: layout.targetSize }]}><Image accessible={false} source={tileAssetForGlyph(content)} resizeMode="contain" style={styles.rasterFill} /><Text style={[styles.glyph, styles[`glyph${landscapeGlyphTone(content)}`], { fontSize: layout.glyphSize }]}>{childFacingGlyph(content)}</Text></View>;
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
  return <View ref={targetRef} onLayout={measureTarget}><Pressable accessibilityRole="button" accessibilityLabel={`Ô trống ${position + 1}${filled ? ", chữ đã điền đúng" : selected ? `, chạm để đặt chữ ${childFacingGlyph(selected)}` : ""}`} accessibilityHint={foundationPreviewAccessibility.dropTargetHint} onPress={() => onPress?.(position)} style={[styles.gap, { width: layout.targetSize, height: layout.targetSize }, filled && styles.filledGap]}><Image accessible={false} source={filled ? tileAssetForGlyph(content) : foundationAssets.missingSlot} resizeMode="contain" style={styles.rasterFill} />{filled ? <Text accessible={false} style={styles.lockMarker}>✓</Text> : null}<Text style={[styles.glyph, styles[`glyph${landscapeGlyphTone(content)}`], { fontSize: layout.glyphSize }]}>{childFacingGlyph(content)}</Text></Pressable></View>;
}

function PreviewLetterTile({ layout, item, selected, onPress, onDrop }: { layout: LandscapeLayout; item: RoundItem; selected: boolean; onPress: () => void; onDrop: (itemId: string, point: { x: number; y: number }) => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);
  const gesture = useMemo(() => Gesture.Pan().minDistance(4).onBegin(() => { dragging.value = true; }).onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY; }).onEnd((event) => { runOnJS(onDrop)(item.id, { x: event.absoluteX, y: event.absoluteY }); }).onFinalize(() => { dragging.value = false; translateX.value = withSpring(0); translateY.value = withSpring(0); }), [dragging, item.id, onDrop, translateX, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: dragging.value ? 1.08 : 1 }] }));
  const displayGlyph = childFacingGlyph(item.glyph);
  return <GestureDetector gesture={gesture}><Animated.View style={animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={`Kéo chữ ${displayGlyph} vào ô trống hoặc chạm để chọn`} accessibilityState={{ selected }} onPress={onPress} style={[styles.tile, { width: layout.trayWidth, height: layout.trayHeight }, selected && styles.tileSelected]}><Image accessible={false} source={tileAssetForGlyph(displayGlyph)} resizeMode="contain" style={styles.rasterFill} /><Text style={[styles.tileText, styles.glyphInverse, { fontSize: layout.glyphSize }]}>{displayGlyph}</Text></Pressable></Animated.View></GestureDetector>;
}

function tileAssetForGlyph(glyph: string) {
  const displayGlyph = childFacingGlyph(glyph);
  if (displayGlyph === "C" || displayGlyph === "D") return foundationAssets.tileGreen;
  if (displayGlyph === "E" || displayGlyph === "G") return foundationAssets.tilePurple;
  return foundationAssets.tileRed;
}

const styles = StyleSheet.create({
  previewRoot: { flex: 1, overflow: "hidden", backgroundColor: "#1B1736" },
  previewCanvas: { flex: 1, minHeight: 0 },
  rasterFill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" },
  typographyCard: { gap: 12 },
  typographyPhrase: { ...namyTypography.child.body, color: namyColors.text.primary },
  typographyHeadline: { ...namyTypography.child.title },
  typographyDisplay: { ...namyTypography.child.display },
  typographyButton: { ...namyTypography.child.button },
  typographyParentTitle: { ...namyTypography.parent.title },
  typographyParentBody: { ...namyTypography.parent.body },
  typographyCorpus: { ...namyTypography.child.body, color: namyColors.text.primary, marginTop: 8 },
  instructionStage: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%", paddingBottom: 8, transform: [{ translateY: 32 }] },
  instructionLayout: { width: "100%", maxWidth: 1080, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  instructionCard: { flex: 1, minHeight: 330, maxWidth: 900, paddingHorizontal: 42, paddingVertical: 36, marginTop: 0, borderRadius: 48, justifyContent: "center", backgroundColor: "#FFFDF7", borderWidth: 2, borderColor: "#FFF7E8", shadowColor: "#466D83", shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 10 },
  instructionMascotSlot: { width: 220, height: 330, marginLeft: 14 },
  primaryAction: { width: "100%", maxWidth: 348, height: 86, borderRadius: 999, marginTop: 22, backgroundColor: "#087FF0", borderColor: "#FFFDF7", borderWidth: 6, shadowColor: "#165FAD", shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 9 },
  primaryActionText: { fontSize: 29, lineHeight: 34 },
  activityStage: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%", minHeight: 0 },
  activityBoard: { width: "100%", maxWidth: 1020, minHeight: 188, paddingHorizontal: 46, paddingVertical: 28, marginTop: 8, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  activityBoardCompact: { minHeight: 112, paddingHorizontal: 28, paddingVertical: 12, marginTop: 0 },
  activityLowerRow: { width: "100%", maxWidth: 1120, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  activeMascotSlot: { width: 128, height: 172 },
  activeMascotSlotCompact: { width: 82, height: 104 },
  trayBoard: { flex: 1, maxWidth: 760, backgroundColor: namyColors.surface.subtle, borderColor: namyColors.surface.raised, borderWidth: 8, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 10, shadowColor: namyColors.brand.primary, shadowOpacity: 0.16, shadowRadius: 14, elevation: 4 },
  trayBoardCompact: { borderWidth: 4, borderRadius: 22, paddingHorizontal: 10, paddingVertical: 4 },
  compactControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  sequence: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  glyphCell: { alignItems: "center", justifyContent: "center" },
  glyphCellrose: { backgroundColor: "#EF4549" },
  glyphCellleaf: { backgroundColor: "#37BA61" },
  glyphCellviolet: { backgroundColor: "#A85ADC" },
  glyphCellsky: { backgroundColor: namyColors.brand.info },
  glyphCellsun: { backgroundColor: namyColors.brand.accent },
  glyphCellcoral: { backgroundColor: namyColors.brand.highlight },
  glyphTileInset: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#F4DEB6", borderWidth: 2, borderColor: "#E5C996", shadowColor: "#B49469", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  gap: { alignItems: "center", justifyContent: "center" },
  filledGap: { shadowColor: namyColors.state.correct, shadowOpacity: 0.45, shadowRadius: 13, elevation: 5 },
  lockMarker: { ...namyTypography.child.button, position: "absolute", top: 4, right: 7, color: namyColors.text.primary, fontSize: 15 },
  glyph: { ...namyTypography.child.button, color: namyColors.text.primary, textShadowColor: "#FFF4D8", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  glyphrose: { color: "#E83F43" }, glyphleaf: { color: "#29A955" }, glyphviolet: { color: "#9B50CD" }, glyphsky: { color: namyColors.brand.info }, glyphsun: { color: "#EAA900" }, glyphcoral: { color: namyColors.brand.highlight },
  glyphInverse: { color: namyColors.text.inverse },
  helper: { ...namyTypography.child.caption, color: namyColors.text.secondary, fontSize: 13, lineHeight: 18, textAlign: "center" },
  tray: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center" },
  tile: { justifyContent: "center", alignItems: "center" },
  tilerose: { backgroundColor: namyColors.brand.highlight },
  tileleaf: { backgroundColor: namyColors.state.correct },
  tileviolet: { backgroundColor: namyColors.brand.primary },
  tilesky: { backgroundColor: namyColors.brand.info },
  tilesun: { backgroundColor: namyColors.brand.accent },
  tilecoral: { backgroundColor: namyColors.brand.highlight },
  tileSelected: { transform: [{ translateY: -4 }, { scale: 1.04 }] },
  tileText: { ...namyTypography.child.button, color: namyColors.text.primary },
  feedbackSlot: { minHeight: 42, justifyContent: "center" },
  feedbackSlotCompact: { minHeight: 28 },
  microFeedback: { width: 300, height: 60, alignSelf: "center", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  microFeedbackCompact: { width: 260, height: 44 },
  microCorrect: { backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.state.correct },
  microRetry: { backgroundColor: namyColors.state.retrySurface, borderColor: namyColors.state.retry },
  microMarker: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 18 },
  notice: { ...namyTypography.child.caption, color: namyColors.text.secondary, fontSize: 13, lineHeight: 18, marginTop: 8, textAlign: "center" },
  completionStage: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%" },
  completionPlaque: { alignSelf: "center", backgroundColor: namyColors.surface.subtle, borderColor: namyColors.surface.raised, borderWidth: 4, borderRadius: 30, paddingHorizontal: 42, paddingVertical: 14, shadowColor: namyColors.brand.primary, shadowOpacity: 0.18, shadowRadius: 13, elevation: 4 },
  completionTitle: { ...namyTypography.child.title, color: namyColors.text.primary, fontSize: 38, lineHeight: 46, textAlign: "center" },
  completionGlow: { alignSelf: "center", width: "74%", maxWidth: 660, minHeight: 230, marginTop: 4, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: namyColors.surface.subtle, shadowColor: namyColors.brand.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 34, elevation: 4 },
  completionMascotSlot: { width: "30%", height: "78%" },
  completionStars: { position: "absolute", ...namyTypography.child.display, color: namyColors.brand.accent, fontSize: 36, textShadowColor: namyColors.surface.raised, textShadowRadius: 12 },
  starOne: { top: 18, left: 42 },
  starTwo: { top: 46, right: 48, fontSize: 28 },
  starThree: { bottom: 18, right: 124, fontSize: 22 },
  completionActions: { flexDirection: "row", alignSelf: "center", width: "100%", maxWidth: 640, gap: 20, marginTop: 10 },
  completionAction: { flex: 1, borderRadius: 999, minHeight: 62, borderWidth: 3, borderColor: namyColors.surface.raised },
  parentSummary: { ...namyTypography.parent.body, color: namyColors.text.primary },
  parentDetail: { ...namyTypography.parent.body, color: namyColors.text.primary, marginTop: 8 },
  inspector: { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#1B1736", borderTopWidth: 1, borderColor: "#3D3766", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  inspectorTitle: { ...namyTypography.child.caption, color: "#FFFFFF" },
  inspectorText: { ...namyTypography.child.caption, color: "#D8D4F0", fontSize: 11, lineHeight: 16, marginTop: 2 },
  inspectorNav: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  inspectorPill: { borderWidth: 1, borderColor: "#615A91", backgroundColor: "#292347", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  inspectorPillActive: { borderColor: namyColors.brand.accent, backgroundColor: "#3D3766" },
  inspectorPillText: { ...namyTypography.child.caption, color: "#FFFFFF", fontSize: 11, lineHeight: 15 },
});
