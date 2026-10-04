import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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
import { NamyScene, SceneAction, SceneCard, SceneIconAction } from "../../ui/NamyScene";
import { namyTypography } from "../../ui/typography";
import { idleGameSession, reduceGameSession } from "../game-session/reducer";
import { createActivityRound, isPointInsideDropTarget, type DropTargetRect, type RoundItem } from "./activity-round";
import { commitOrQueueCompletion } from "./completion-orchestrator";
import { activityPresentationStage, automaticFeedbackTransition, childCompletionPresentation, childFacingGlyph, foundationPreviewAccessibility, landscapeLayoutForWidth, positionsForCompletionAction, selectedLetterHelper, type LandscapeLayout, type PlacementMicroFeedback } from "./presentation";
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
  const { width } = useWindowDimensions();
  const landscapeLayout = landscapeLayoutForWidth(width);
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
    if (result === "unavailable") setAudioNotice("Voice asset đang là DEV_PLACEHOLDER; hướng dẫn bằng hình và chữ vẫn hoạt động.");
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
    setAudioNotice("Hỗ trợ đã hiển thị một chữ; lượt này được đánh dấu hỗ trợ.");
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

  if (stage === "instruction") return <NamyScene landscape stateCode="S03" title="Kéo chữ vào ô trống" description="Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ." headerRight={<SceneIconAction icon="🔊" accessibilityLabel={foundationPreviewAccessibility.speakerLabel} accessibilityHint={foundationPreviewAccessibility.speakerHint} onPress={() => void replayInstruction()} size={landscapeLayout.controlSize} />}>
    <View style={styles.instructionStage}>
      <SceneCard style={styles.instructionCard}><Sequence layout={landscapeLayout} sequence={config.visibleSequence} positions={positions} placed={{}} /></SceneCard>
      <SceneAction label="Bắt đầu" onPress={startCanonicalSession} tone="leaf" accessibilityHint="Mở bài học" style={[styles.primaryAction, { minHeight: landscapeLayout.primaryActionHeight }]} />
    </View>
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.safeNotice}>{audioNotice}</Text> : null}
  </NamyScene>;

  if (stage === "complete") return <NamyScene landscape minimal stateCode="S07" title={childCompletionPresentation.title}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.completionGlow}><Text style={styles.completionStars}>★ ✦ ★</Text></View>
    <View style={styles.completionActions}>
      <SceneAction label={childCompletionPresentation.actions[1]} onPress={replayRound} tone="paper" disabled={savingCompletion || session.phase !== "COMPLETED"} style={styles.completionAction} />
      <SceneAction label={childCompletionPresentation.actions[0]} onPress={startNewRound} tone="leaf" disabled={savingCompletion || session.phase !== "COMPLETED"} style={styles.completionAction} />
    </View>
  </NamyScene>;

  return <NamyScene landscape scrollEnabled={false} stateCode="S04" title="Chữ cái còn thiếu" description="Kéo một thẻ vào ô trống, hoặc chọn thẻ rồi chạm ô trống." headerRight={<SceneIconAction icon="🔊" accessibilityLabel={foundationPreviewAccessibility.speakerLabel} accessibilityHint={foundationPreviewAccessibility.speakerHint} onPress={() => void replayInstruction()} size={landscapeLayout.controlSize} />}>
    <View style={[styles.activityStage, { gap: landscapeLayout.activityGap }]}>
      <SceneCard style={styles.activityBoard}><Sequence layout={landscapeLayout} sequence={config.visibleSequence} positions={positions} placed={placed} onTargetPress={selectThenPlace} onTargetMeasured={(position, rect) => { targetRects.current = { ...targetRects.current, [position]: rect }; }} selected={selected?.glyph ?? null} /></SceneCard>
      <View style={styles.feedbackSlot}>{microFeedback ? <View accessibilityLiveRegion="polite" style={[styles.microFeedback, microFeedback.kind === "correct" ? styles.microCorrect : styles.microRetry]}><Text accessibilityElementsHidden style={styles.microMarker}>{microFeedback.marker === "check" ? "✓" : "↩"}</Text><Text style={styles.microText}>{microFeedback.message}</Text></View> : null}</View>
      <View style={styles.activityLowerRow}>
        <View style={[styles.tray, { gap: landscapeLayout.trayGap }]}>{round.items.filter((item) => placed[item.position] === undefined).map((item) => <DraggableLetterTile key={item.id} layout={landscapeLayout} item={item} selected={selectedId === item.id} onPress={() => setSelectedId(item.id)} onDrop={handleDrop} />)}</View>
        <View style={styles.compactControls}>
          <SceneIconAction icon="💡" accessibilityLabel="Gợi ý" onPress={revealHint} disabled={!hintEligible} accessibilityHint={hintEligible ? foundationPreviewAccessibility.hintAvailable : foundationPreviewAccessibility.hintUnavailable} size={landscapeLayout.controlSize} />
          <SceneIconAction icon="↻" accessibilityLabel="Lượt mới" onPress={refreshRound} disabled={Object.keys(placed).length > 0} accessibilityHint={foundationPreviewAccessibility.refreshHint} size={landscapeLayout.controlSize} />
        </View>
      </View>
      <Text style={styles.helper}>{selected ? selectedLetterHelper(selected.glyph) : "Kéo hoặc chọn một thẻ chữ bên dưới."}</Text>
    </View>
    {audioNotice ? <Text accessibilityLiveRegion="polite" style={styles.safeNotice}>{audioNotice}</Text> : null}
  </NamyScene>;
}

function Sequence({ layout, sequence, positions, placed, onTargetPress, onTargetMeasured, selected }: { layout: LandscapeLayout; sequence: readonly string[]; positions: readonly number[]; placed: Readonly<Record<number, string>>; onTargetPress?: (position: number) => void; onTargetMeasured?: (position: number, rect: DropTargetRect) => void; selected?: string | null }) {
  return <View accessibilityLabel="Dãy chữ theo thứ tự" style={[styles.sequence, { gap: layout.targetGap }]}>{sequence.map((glyph, index) => {
    const missing = positions.includes(index);
    const content = placed[index] ?? (missing ? "?" : glyph);
    return missing ? <DropTarget key={`${glyph}-${index}`} layout={layout} position={index} content={content} filled={Boolean(placed[index])} selected={selected} onPress={onTargetPress} onMeasured={onTargetMeasured} /> : <View key={`${glyph}-${index}`} style={[styles.glyphCell, { width: layout.targetSize, height: layout.targetSize, borderRadius: layout.targetRadius }]}><Text style={[styles.glyph, { fontSize: layout.glyphSize }]}>{childFacingGlyph(content)}</Text></View>;
  })}</View>;
}

function DropTarget({ layout, position, content, filled, selected, onPress, onMeasured }: { layout: LandscapeLayout; position: number; content: string; filled: boolean; selected?: string | null; onPress?: (position: number) => void; onMeasured?: (position: number, rect: DropTargetRect) => void }) {
  const targetRef = useRef<View>(null);
  const measureTarget = () => targetRef.current?.measureInWindow((x, y, width, height) => onMeasured?.(position, { x, y, width, height }));
  return <View ref={targetRef} onLayout={measureTarget}><Pressable accessibilityRole="button" accessibilityLabel={`Ô trống ${position + 1}${filled ? ", chữ đã khóa đúng vị trí" : selected ? `, đặt ${childFacingGlyph(selected)}` : ""}`} accessibilityHint={foundationPreviewAccessibility.dropTargetHint} onPress={() => onPress?.(position)} style={[styles.gap, { width: layout.targetSize, height: layout.targetSize, borderRadius: layout.targetRadius }, filled && styles.filledGap]}>{filled ? <Text accessibilityElementsHidden style={styles.lockMarker}>✓</Text> : null}<Text style={[styles.glyph, { fontSize: layout.glyphSize }]}>{childFacingGlyph(content)}</Text></Pressable></View>;
}

function DraggableLetterTile({ layout, item, selected, onPress, onDrop }: { layout: LandscapeLayout; item: RoundItem; selected: boolean; onPress: () => void; onDrop: (itemId: string, point: { x: number; y: number }) => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const panGesture = useMemo(() => Gesture.Pan().minDistance(4).onBegin(() => { isDragging.value = true; }).onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY; }).onEnd((event) => { runOnJS(onDrop)(item.id, { x: event.absoluteX, y: event.absoluteY }); }).onFinalize(() => { isDragging.value = false; translateX.value = withSpring(0); translateY.value = withSpring(0); }), [isDragging, item.id, onDrop, translateX, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: isDragging.value ? 1.08 : 1 }], zIndex: isDragging.value ? 1 : 0 }));
  const displayGlyph = childFacingGlyph(item.glyph);
  return <GestureDetector gesture={panGesture}><Animated.View style={animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={`Kéo ${displayGlyph} vào ô trống hoặc chọn để đặt`} accessibilityState={{ selected }} onPress={onPress} style={[styles.letterTile, { width: layout.trayWidth, height: layout.trayHeight, borderRadius: layout.trayRadius }, selected && styles.letterTileSelected]}><Text style={[styles.letterText, { fontSize: layout.glyphSize }]}>{displayGlyph}</Text></Pressable></Animated.View></GestureDetector>;
}

const styles = StyleSheet.create({
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
  letterTile: { backgroundColor: namyColors.brand.accent, borderWidth: 1, borderColor: namyColors.border.strong, justifyContent: "center", alignItems: "center", shadowColor: namyColors.brand.primary, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
  letterTileSelected: { backgroundColor: namyColors.brand.info, transform: [{ translateY: -4 }] },
  letterText: { ...namyTypography.child.button, color: namyColors.text.primary },
  feedbackSlot: { minHeight: 42, justifyContent: "center" },
  microFeedback: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 7 },
  microCorrect: { backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.state.correct },
  microRetry: { backgroundColor: namyColors.state.retrySurface, borderColor: namyColors.state.retry },
  microMarker: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 18 },
  microText: { ...namyTypography.child.button, color: namyColors.text.primary, fontSize: 15 },
  safeNotice: { ...namyTypography.child.caption, color: namyColors.text.secondary, fontSize: 13, lineHeight: 18, marginTop: 8, paddingHorizontal: 6, textAlign: "center" },
  completionGlow: { alignSelf: "center", width: "72%", maxWidth: 620, minHeight: 120, marginTop: 12, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: namyColors.surface.subtle, shadowColor: namyColors.brand.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 28, elevation: 3 },
  completionStars: { ...namyTypography.child.display, color: namyColors.brand.accent, fontSize: 36 },
  completionActions: { flexDirection: "row", alignSelf: "center", width: "100%", maxWidth: 640, gap: 16, marginTop: 14 },
  completionAction: { flex: 1, borderRadius: 999 },
});
