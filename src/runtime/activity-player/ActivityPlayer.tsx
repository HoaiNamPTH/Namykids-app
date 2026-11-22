import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { unavailableAudioService, type AudioCue } from "../../audio/audio-service";
import type { AlphabetMissingLettersConfig } from "../../content/missing-letters/schema";
import type { RuntimeDataGateway } from "../../data/contracts";
import type { GameSessionState, SessionPin } from "../../domain/types";
import { e02DragDropEngine, type E02InputMode } from "../../engines/e02-drag-drop/contracts";
import { JsonPendingCompletionRepository, JsonSessionSnapshotRepository, type SessionSnapshot } from "../../persistence/contracts";
import { secureDeviceStore } from "../../persistence/secure-device-store";
import { reconcilePendingCompletions, type WebSessionRefresh } from "../../sync/outbox-reconciliation";
import { namyColors } from "../../ui/brand-tokens";
import { CompletionScreen, FoundationCircleAction } from "../../ui/FoundationScreens";
import { foundationAssets } from "../../ui/foundation-assets";
import { NamyScene } from "../../ui/NamyScene";
import { S03InstructionContent, S03LandscapeBackdrop, S03RasterIconAction, s03ProductionAssets } from "../../ui/S03ProductionAssets";
import { namyTypography } from "../../ui/typography";
import { idleGameSession, reduceGameSession } from "../game-session/reducer";
import { createActivityRound, isPointInsideDropTarget, type DropTargetRect, type RoundItem } from "./activity-round";
import { commitOrQueueCompletion } from "./completion-orchestrator";
import { activityPresentationStage, automaticFeedbackTransition, childFacingGlyph, foundationPreviewAccessibility, foundationPreviewPresentation, landscapeGlyphTone, landscapeLayoutForWidth, positionsForCompletionAction, selectedLetterHelper, type LandscapeLayout, type PlacementMicroFeedback } from "./presentation";
import { assessRoundPlacement, createRoundAssessment, isHintEligible, revealHintForRound, summarizeRoundAssessment, type RoundAssessmentState } from "./round-assessment";
import { createSessionSnapshot } from "./session-snapshot";

type TargetRects = Readonly<Record<number, DropTargetRect>>;

type ActivityPlayerProps = {
  parentUserId: string;
  runtime: Pick<RuntimeDataGateway, "commitActivityCompletion">;
  refreshWebSession: WebSessionRefresh;
  config: AlphabetMissingLettersConfig;
  pin: SessionPin;
  initialSnapshot: SessionSnapshot | null;
};

export function ActivityPlayer({ parentUserId, runtime, refreshWebSession, config, pin, initialSnapshot }: ActivityPlayerProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const landscapeLayout = landscapeLayoutForWidth(width);
  const compactLandscape = height <= 430;
  const [session, dispatch] = useReducer(reduceGameSession, initialSnapshot?.state ?? idleGameSession);
  const stage = activityPresentationStage(session.phase);
  const [positions, setPositions] = useState<readonly number[]>(initialSnapshot?.activityState.positions ?? config.missingPositions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Readonly<Record<number, string>>>(initialSnapshot?.activityState.placed ?? {});
  const [assessment, setAssessment] = useState<RoundAssessmentState>(() => initialSnapshot?.activityState.assessment ?? createRoundAssessment());
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [, setCompletionNotice] = useState<string | null>(initialSnapshot?.state.phase === "COMPLETING" ? "completion_retry_pending" : null);
  const [microFeedback, setMicroFeedback] = useState<PlacementMicroFeedback | null>(null);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const targetRects = useRef<TargetRects>({});
  const startedAt = useRef<string | null>(initialSnapshot?.startedAt ?? null);
  const assessmentRef = useRef(assessment);
  const sessions = useMemo(() => new JsonSessionSnapshotRepository(secureDeviceStore), []);
  const outbox = useMemo(() => new JsonPendingCompletionRepository(secureDeviceStore), []);
  const round = useMemo(() => createActivityRound(config, positions), [config, positions]);
  const allPlaced = positions.every((position) => placed[position] !== undefined);
  const selected = round.items.find((item) => item.id === selectedId) ?? null;
  const hintEligible = isHintEligible(assessment);

  const updateAssessment = useCallback((next: RoundAssessmentState) => {
    assessmentRef.current = next;
    setAssessment(next);
  }, []);

  const snapshotFor = useCallback((state: GameSessionState) => createSessionSnapshot({
    parentUserId,
    pin,
    state,
    startedAt: startedAt.current ?? new Date().toISOString(),
    config,
    positions,
    placed,
    assessment,
  }), [assessment, config, parentUserId, pin, placed, positions]);

  useEffect(() => {
    if (session.phase === "IDLE" || session.phase === "COMPLETED") return;
    void sessions.save(snapshotFor(session)).catch(() => {
      setCompletionNotice("Thiết bị chưa thể lưu snapshot an toàn; lượt sẽ không được gửi cho đến khi lưu được.");
    });
  }, [session, sessions, snapshotFor]);

  const syncPending = useCallback(async () => {
    try {
      const pending = await outbox.list(parentUserId, pin.childId);
      if (pending.length === 0) return;
      const results = await reconcilePendingCompletions(pending, outbox, runtime, refreshWebSession);
      const committed = results.filter((result) => result.status === "committed").length;
      if (committed > 0) setCompletionNotice(`${committed} lượt đã đồng bộ bằng đúng completion ID đã lưu.`);
    } catch {
      setCompletionNotice("Outbox vẫn được giữ lại; chưa thể đồng bộ ở lần này.");
    }
  }, [outbox, parentUserId, pin.childId, refreshWebSession, runtime]);

  useEffect(() => {
    void syncPending();
    return () => { void unavailableAudioService.stop(); };
  }, [syncPending]);

  const startCanonicalSession = () => {
    startedAt.current = new Date().toISOString();
    dispatch({ type: "START", pin });
    dispatch({ type: "START", pin });
  };

  const completeRound = async () => {
    if ((session.phase !== "ROUND_COMPLETE" && session.phase !== "COMPLETING") || savingCompletion) return;
    const completionId = session.completionId ?? globalThis.crypto?.randomUUID?.();
    if (!completionId) {
      setCompletionNotice("Thiết bị chưa thể tạo mã lưu lượt an toàn.");
      return;
    }
    const completingState = session.phase === "ROUND_COMPLETE"
      ? reduceGameSession(session, { type: "COMPLETED", completionId })
      : session;
    try {
      setSavingCompletion(true);
      await sessions.save(snapshotFor(completingState));
      if (session.phase === "ROUND_COMPLETE") dispatch({ type: "COMPLETED", completionId });
      const result = await commitOrQueueCompletion({
        parentUserId,
        pin,
        completionId,
        startedAt: startedAt.current ?? new Date().toISOString(),
        completedAt: new Date().toISOString(),
        assisted: completingState.assisted,
        requiresFull: config.requiresFull,
        assessmentSummary: summarizeRoundAssessment(assessmentRef.current),
        beginSnapshot: {
          node_key: "alphabet-missing-letters",
          release_id: pin.contentReleaseId,
          node_version_id: pin.nodeVersionId,
          engine_code: "E02",
          engine_version: pin.engineVersion ?? config.engineVersion,
          content_hash: pin.contentHash,
          ordered_sequence_id: config.orderedSequenceId,
          missing_positions: [...positions],
        },
      }, runtime, outbox);
      if (result === "blocked") {
        setCompletionNotice("Lượt chơi chưa thể lưu do phiên hoặc binding không còn hợp lệ. Mã hoàn thành được giữ nguyên để khôi phục.");
        return;
      }
      await sessions.clear(snapshotFor(completingState));
      setCompletionNotice(result === "queued" ? "Lượt chơi đã được lưu an toàn để đồng bộ." : "Lượt chơi đã được lưu an toàn.");
      dispatch({ type: "COMMIT_SUCCEEDED" });
    } catch {
      setCompletionNotice("Chưa thể ghi durable snapshot/outbox. Mã hoàn thành được giữ nguyên và chưa bị gửi lại bằng mã mới.");
    } finally {
      setSavingCompletion(false);
    }
  };

  useEffect(() => {
    if (session.phase === "ROUND_COMPLETE" || session.phase === "COMPLETING") void completeRound();
  }, [session.phase]);

  const replayInstruction = async () => {
    const result = await unavailableAudioService.play("instruction", config.instructionAudioAssetId);
    if (result === "unavailable") setAudioNotice(foundationPreviewPresentation.S03.audioFallback);
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
        void playFeedbackCue("correct", config.feedback.correctAudioAssetId)
          .then(() => playFeedbackCue("completion", config.feedback.completionAudioAssetId));
      } else {
        void playFeedbackCue(transition.audioCue, config.feedback.correctAudioAssetId);
      }
      dispatch({ type: "ADVANCE_ROUND", isFinalRound: transition.isFinalRound });
      return;
    }
    if (transition.action === "request_retry") {
      setMicroFeedback(transition.feedback);
      void playFeedbackCue(transition.audioCue, config.feedback.retryAudioAssetId);
      dispatch({ type: "RETRY_REQUESTED" });
      return;
    }
    dispatch({ type: "START", pin });
  }, [allPlaced, config.feedback.completionAudioAssetId, config.feedback.correctAudioAssetId, config.feedback.retryAudioAssetId, pin, playFeedbackCue, session.phase]);

  useEffect(() => {
    if (!microFeedback) return;
    const timer = setTimeout(() => setMicroFeedback(null), 800);
    return () => clearTimeout(timer);
  }, [microFeedback]);

  const submitPlacement = (itemId: string, targetPosition: number, inputMode: E02InputMode, answerRevealed = session.assisted) => {
    if (session.phase !== "ACTIVE" || placed[targetPosition]) return;
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
    if (result.correct) setPlaced((current) => ({ ...current, [targetPosition]: item.glyph }));
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
    const revealedAssessment = revealHintForRound(assessmentRef.current);
    if (revealedAssessment === assessmentRef.current) return;
    const next = positions.find((position) => placed[position] === undefined);
    const item = round.items.find((candidate) => candidate.position === next);
    const target = round.config.dropTargets.find((candidate) => candidate.position === next);
    if (next === undefined || !item || !target || session.phase !== "ACTIVE") return;
    updateAssessment(revealedAssessment);
    dispatch({ type: "HINT_USED", answerRevealed: true });
    submitPlacement(item.id, next, "select_then_place", true);
    setAudioNotice("Nami đã giúp con một chữ nhé!");
  };

  const refreshRound = () => {
    if (Object.keys(placed).length > 0) return;
    const next = e02DragDropEngine.selectRefreshPositions(config, positions);
    targetRects.current = {};
    setSelectedId(null);
    updateAssessment(createRoundAssessment());
    if (next.join(":") !== positions.join(":")) {
      setPositions(next);
    }
  };

  const restart = (nextPositions: readonly number[]) => {
    targetRects.current = {};
    startedAt.current = null;
    setPlaced({});
    setSelectedId(null);
    setPositions([...nextPositions]);
    updateAssessment(createRoundAssessment());
    setCompletionNotice(null);
    setMicroFeedback(null);
    dispatch({ type: "RESET" });
  };

  const startNewRound = () => restart(positionsForCompletionAction("Chơi mới", config, positions));
  const replayRound = () => restart(positionsForCompletionAction("Chơi lại", config, positions));

  if (stage === "instruction") return <NamyScene key="activity-s03" landscape landscapeBackdrop={<S03LandscapeBackdrop />} hideHeading stateCode="S03" title="Kéo chữ vào ô trống" description="Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ." headerLeft={<S03RasterIconAction source={s03ProductionAssets.back} accessibilityLabel={foundationPreviewAccessibility.backLabel} accessibilityHint={foundationPreviewAccessibility.backHint} onPress={() => router.back()} size={landscapeLayout.controlSize} />} headerRight={<S03RasterIconAction source={s03ProductionAssets.speaker} accessibilityLabel={foundationPreviewAccessibility.speakerLabel} accessibilityHint={foundationPreviewAccessibility.speakerHint} onPress={() => void replayInstruction()} size={landscapeLayout.controlSize} />}>
    <S03InstructionContent sequence={config.visibleSequence} missingPositions={positions} actionLabel="Bắt đầu" onStart={startCanonicalSession} />
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.safeNotice}>{audioNotice}</Text> : null}
  </NamyScene>;

  if (stage === "complete") return <CompletionScreen onReplay={replayRound} onNew={startNewRound} disabled={savingCompletion || session.phase !== "COMPLETED"} />;

  return <NamyScene key="activity-s04" landscape landscapeBackdrop={<S03LandscapeBackdrop />} hideHeading scrollEnabled={false} stateCode="S04" title="Chữ cái còn thiếu" description="Kéo một thẻ vào ô trống, hoặc chọn thẻ rồi chạm ô trống." headerLeft={<FoundationCircleAction source={foundationAssets.back} label={foundationPreviewAccessibility.backLabel} hint={foundationPreviewAccessibility.backHint} onPress={() => router.back()} size={landscapeLayout.controlSize} />} headerRight={<FoundationCircleAction source={foundationAssets.speaker} label={foundationPreviewAccessibility.speakerLabel} hint={foundationPreviewAccessibility.speakerHint} onPress={() => void replayInstruction()} size={landscapeLayout.controlSize} />}>
    <View style={[styles.activityStage, { gap: compactLandscape ? 4 : landscapeLayout.activityGap }]}>
      <View style={[styles.activityBoard, compactLandscape && styles.activityBoardCompact]}><Image accessible={false} source={foundationAssets.activityPanel} resizeMode="stretch" style={styles.rasterFill} /><Sequence layout={landscapeLayout} sequence={config.visibleSequence} positions={positions} placed={placed} onTargetPress={selectThenPlace} onTargetMeasured={(position, rect) => { targetRects.current = { ...targetRects.current, [position]: rect }; }} selected={selected?.glyph ?? null} /></View>
      <View style={[styles.feedbackSlot, compactLandscape && styles.feedbackSlotCompact]}>{microFeedback ? <View accessible accessibilityRole="text" accessibilityLabel={`${microFeedback.marker === "check" ? "✓ " : "↩ "}${microFeedback.message}`} accessibilityLiveRegion="polite" style={[styles.microFeedback, compactLandscape && styles.microFeedbackCompact]}><Image accessible={false} source={microFeedback.kind === "correct" ? foundationAssets.feedbackCorrect : foundationAssets.feedbackRetry} resizeMode="stretch" style={styles.rasterFill} /></View> : null}</View>
      <View style={styles.activityLowerRow}>
        <Image testID="nami-active-asset-slot" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" source={foundationAssets.namiGuide} resizeMode="contain" style={[styles.activeMascotSlot, compactLandscape && styles.activeMascotSlotCompact]} />
        <View style={[styles.trayBoard, compactLandscape && styles.trayBoardCompact]}><View style={[styles.tray, { gap: landscapeLayout.trayGap }]}>{round.items.filter((item) => placed[item.position] === undefined).map((item) => <DraggableLetterTile key={item.id} layout={landscapeLayout} item={item} selected={selectedId === item.id} onPress={() => setSelectedId(item.id)} onDrop={handleDrop} />)}</View></View>
        <View style={styles.compactControls}>
          <FoundationCircleAction source={foundationAssets.hint} label="Gợi ý" onPress={revealHint} disabled={!hintEligible} hint={hintEligible ? foundationPreviewAccessibility.hintAvailable : foundationPreviewAccessibility.hintUnavailable} size={landscapeLayout.controlSize} />
          <FoundationCircleAction source={foundationAssets.refresh} label="Lượt mới" onPress={refreshRound} disabled={Object.keys(placed).length > 0} hint={foundationPreviewAccessibility.refreshHint} size={landscapeLayout.controlSize} />
        </View>
      </View>
      {!compactLandscape ? <Text style={styles.helper}>{selected ? selectedLetterHelper(selected.glyph) : "Kéo hoặc chọn một thẻ chữ bên dưới."}</Text> : null}
    </View>
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.safeNotice}>{audioNotice}</Text> : null}
  </NamyScene>;
}

function Sequence({ layout, sequence, positions, placed, onTargetPress, onTargetMeasured, selected }: { layout: LandscapeLayout; sequence: readonly string[]; positions: readonly number[]; placed: Readonly<Record<number, string>>; onTargetPress?: (position: number) => void; onTargetMeasured?: (position: number, rect: DropTargetRect) => void; selected?: string | null }) {
  return <View accessibilityLabel="Dãy chữ theo thứ tự" style={[styles.sequence, { gap: layout.targetGap }]}>{sequence.map((glyph, index) => {
    const missing = positions.includes(index);
    const content = placed[index] ?? (missing ? "?" : glyph);
    return missing ? <DropTarget key={`${glyph}-${index}`} layout={layout} position={index} content={content} filled={Boolean(placed[index])} selected={selected} onPress={onTargetPress} onMeasured={onTargetMeasured} /> : <View key={`${glyph}-${index}`} style={[styles.glyphCell, { width: layout.targetSize, height: layout.targetSize }]}><Image accessible={false} source={tileAssetForGlyph(content)} resizeMode="contain" style={styles.rasterFill} /><Text style={[styles.glyph, styles[`glyph${landscapeGlyphTone(content)}`], { fontSize: layout.glyphSize }]}>{childFacingGlyph(content)}</Text></View>;
  })}</View>;
}

function DropTarget({ layout, position, content, filled, selected, onPress, onMeasured }: { layout: LandscapeLayout; position: number; content: string; filled: boolean; selected?: string | null; onPress?: (position: number) => void; onMeasured?: (position: number, rect: DropTargetRect) => void }) {
  const targetRef = useRef<View>(null);
  const measureTarget = () => targetRef.current?.measureInWindow((x, y, width, height) => onMeasured?.(position, { x, y, width, height }));
  return <View ref={targetRef} onLayout={measureTarget}><Pressable accessibilityRole="button" accessibilityLabel={`Ô trống ${position + 1}${filled ? ", chữ đã khóa đúng vị trí" : selected ? `, đặt ${childFacingGlyph(selected)}` : ""}`} accessibilityHint={foundationPreviewAccessibility.dropTargetHint} onPress={() => onPress?.(position)} style={[styles.gap, { width: layout.targetSize, height: layout.targetSize }, filled && styles.filledGap]}><Image accessible={false} source={filled ? tileAssetForGlyph(content) : foundationAssets.missingSlot} resizeMode="contain" style={styles.rasterFill} />{filled ? <Text accessibilityElementsHidden style={styles.lockMarker}>✓</Text> : null}<Text style={[styles.glyph, styles[`glyph${landscapeGlyphTone(content)}`], { fontSize: layout.glyphSize }]}>{childFacingGlyph(content)}</Text></Pressable></View>;
}

function DraggableLetterTile({ layout, item, selected, onPress, onDrop }: { layout: LandscapeLayout; item: RoundItem; selected: boolean; onPress: () => void; onDrop: (itemId: string, point: { x: number; y: number }) => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const panGesture = useMemo(() => Gesture.Pan().minDistance(4).onBegin(() => { isDragging.value = true; }).onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY; }).onEnd((event) => { runOnJS(onDrop)(item.id, { x: event.absoluteX, y: event.absoluteY }); }).onFinalize(() => { isDragging.value = false; translateX.value = withSpring(0); translateY.value = withSpring(0); }), [isDragging, item.id, onDrop, translateX, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: isDragging.value ? 1.08 : 1 }], zIndex: isDragging.value ? 1 : 0 }));
  const displayGlyph = childFacingGlyph(item.glyph);
  return <GestureDetector gesture={panGesture}><Animated.View style={animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={`Kéo ${displayGlyph} vào ô trống hoặc chọn để đặt`} accessibilityState={{ selected }} onPress={onPress} style={[styles.letterTile, { width: layout.trayWidth, height: layout.trayHeight }, selected && styles.letterTileSelected]}><Image accessible={false} source={tileAssetForGlyph(displayGlyph)} resizeMode="contain" style={styles.rasterFill} /><Text style={[styles.letterText, styles.glyphInverse, { fontSize: layout.glyphSize }]}>{displayGlyph}</Text></Pressable></Animated.View></GestureDetector>;
}

function tileAssetForGlyph(glyph: string) {
  const displayGlyph = childFacingGlyph(glyph);
  if (displayGlyph === "C" || displayGlyph === "D") return foundationAssets.tileGreen;
  if (displayGlyph === "E" || displayGlyph === "G") return foundationAssets.tilePurple;
  return foundationAssets.tileRed;
}

const styles = StyleSheet.create({
  rasterFill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" },
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
  letterTile: { justifyContent: "center", alignItems: "center" },
  letterTilerose: { backgroundColor: namyColors.brand.highlight },
  letterTileleaf: { backgroundColor: namyColors.state.correct },
  letterTileviolet: { backgroundColor: namyColors.brand.primary },
  letterTilesky: { backgroundColor: namyColors.brand.info },
  letterTilesun: { backgroundColor: namyColors.brand.accent },
  letterTilecoral: { backgroundColor: namyColors.brand.highlight },
  letterTileSelected: { transform: [{ translateY: -4 }, { scale: 1.04 }] },
  letterText: { ...namyTypography.child.button, color: namyColors.text.primary },
  feedbackSlot: { minHeight: 42, justifyContent: "center" },
  feedbackSlotCompact: { minHeight: 28 },
  microFeedback: { width: 300, height: 60, alignSelf: "center", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  microFeedbackCompact: { width: 260, height: 44 },
  microCorrect: { backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.state.correct },
  microRetry: { backgroundColor: namyColors.state.retrySurface, borderColor: namyColors.state.retry },
  microMarker: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 18 },
  safeNotice: { ...namyTypography.child.caption, color: namyColors.text.secondary, fontSize: 13, lineHeight: 18, marginTop: 8, paddingHorizontal: 6, textAlign: "center" },
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
});
