import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { namyColors, namyTypography } from "../../ui/brand-tokens";
import { DevAssetNotice, NamyScene, SceneAction, SceneCard } from "../../ui/NamyScene";
import { idleGameSession, reduceGameSession } from "../game-session/reducer";
import { createActivityRound, isPointInsideDropTarget, type DropTargetRect, type RoundItem } from "./activity-round";
import { commitOrQueueCompletion } from "./completion-orchestrator";
import { activityPresentationStage, automaticFeedbackTransition, childCompletionPresentation, positionsForCompletionAction, type PlacementMicroFeedback } from "./presentation";
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

  if (stage === "instruction") return <NamyScene stateCode="S03" title="Kéo chữ vào ô trống" description="Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ.">
    <SceneCard><Sequence sequence={config.visibleSequence} positions={positions} placed={{}} /><Text style={styles.visualText}>Hình minh họa là DEV_PLACEHOLDER; không tiết lộ đáp án trước lượt chơi.</Text></SceneCard>
    <SceneAction label="Nghe lại hướng dẫn" onPress={() => void replayInstruction()} tone="paper" />
    <SceneAction label="Bắt đầu" onPress={startCanonicalSession} tone="leaf" accessibilityHint="Mở lượt Missing Letters" />
    {audioNotice ? <Text style={styles.safeNotice}>{audioNotice}</Text> : null}<DevAssetNotice />
  </NamyScene>;

  if (stage === "complete") return <NamyScene minimal stateCode="S07" title={childCompletionPresentation.title}>
    <SceneCard style={styles.completionCard}><Text accessibilityLiveRegion="polite" style={styles.completion}>{childCompletionPresentation.message}</Text></SceneCard>
    <SceneAction label={childCompletionPresentation.actions[0]} onPress={startNewRound} tone="leaf" disabled={savingCompletion || session.phase !== "COMPLETED"} />
    <SceneAction label={childCompletionPresentation.actions[1]} onPress={replayRound} tone="paper" disabled={savingCompletion || session.phase !== "COMPLETED"} />
  </NamyScene>;

  return <NamyScene scrollEnabled={false} stateCode="S04" title="Chữ cái còn thiếu" description="Kéo một thẻ vào ô trống, hoặc chọn thẻ rồi chạm ô trống để dùng chế độ hỗ trợ.">
    <SceneCard><Sequence sequence={config.visibleSequence} positions={positions} placed={placed} onTargetPress={selectThenPlace} onTargetMeasured={(position, rect) => { targetRects.current = { ...targetRects.current, [position]: rect }; }} selected={selected?.glyph ?? null} /><Text style={styles.helper}>{selected ? `Đã chọn ${selected.glyph}. Chọn một ô trống.` : "Kéo hoặc chọn một thẻ chữ bên dưới."}</Text></SceneCard>
    {microFeedback ? <View accessibilityLiveRegion="polite" style={[styles.microFeedback, microFeedback.kind === "correct" ? styles.microCorrect : styles.microRetry]}><Text accessibilityElementsHidden style={styles.microMarker}>{microFeedback.marker === "check" ? "✓" : "↩"}</Text><Text style={styles.microText}>{microFeedback.message}</Text></View> : null}
    <View style={styles.tray}>{round.items.filter((item) => placed[item.position] === undefined).map((item) => <DraggableLetterTile key={item.id} item={item} selected={selectedId === item.id} onPress={() => setSelectedId(item.id)} onDrop={handleDrop} />)}</View><SceneAction label="Gợi ý" onPress={revealHint} tone="paper" disabled={!hintEligible} accessibilityHint={hintEligible ? "Hiển thị một chữ và đánh dấu lượt chơi có hỗ trợ" : "Mở sau một lần đặt chữ chưa đúng trong lượt hiện tại"} /><SceneAction label="Lượt mới" onPress={refreshRound} tone="paper" disabled={Object.keys(placed).length > 0} accessibilityHint="Chỉ hoạt động trước khi đặt chữ đầu tiên" />
    {audioNotice ? <Text style={styles.safeNotice}>{audioNotice}</Text> : null}<DevAssetNotice compact />
  </NamyScene>;
}

function Sequence({ sequence, positions, placed, onTargetPress, onTargetMeasured, selected }: { sequence: readonly string[]; positions: readonly number[]; placed: Readonly<Record<number, string>>; onTargetPress?: (position: number) => void; onTargetMeasured?: (position: number, rect: DropTargetRect) => void; selected?: string | null }) {
  return <View accessibilityLabel="Dãy chữ theo thứ tự" style={styles.sequence}>{sequence.map((glyph, index) => {
    const missing = positions.includes(index);
    const content = placed[index] ?? (missing ? "?" : glyph);
    return missing ? <DropTarget key={`${glyph}-${index}`} position={index} content={content} filled={Boolean(placed[index])} selected={selected} onPress={onTargetPress} onMeasured={onTargetMeasured} /> : <View key={`${glyph}-${index}`} style={styles.glyphCell}><Text style={styles.glyph}>{content}</Text></View>;
  })}</View>;
}

function DropTarget({ position, content, filled, selected, onPress, onMeasured }: { position: number; content: string; filled: boolean; selected?: string | null; onPress?: (position: number) => void; onMeasured?: (position: number, rect: DropTargetRect) => void }) {
  const targetRef = useRef<View>(null);
  const measureTarget = () => targetRef.current?.measureInWindow((x, y, width, height) => onMeasured?.(position, { x, y, width, height }));
  return <View ref={targetRef} onLayout={measureTarget}><Pressable accessibilityRole="button" accessibilityLabel={`Ô trống ${position + 1}${filled ? ", chữ đã khóa đúng vị trí" : selected ? `, đặt ${selected}` : ""}`} accessibilityHint="Chạm sau khi chọn thẻ, hoặc thả thẻ vào đây" onPress={() => onPress?.(position)} style={[styles.gap, filled && styles.filledGap]}>{filled ? <Text accessibilityElementsHidden style={styles.lockMarker}>✓</Text> : null}<Text style={styles.glyph}>{content}</Text></Pressable></View>;
}

function DraggableLetterTile({ item, selected, onPress, onDrop }: { item: RoundItem; selected: boolean; onPress: () => void; onDrop: (itemId: string, point: { x: number; y: number }) => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const panGesture = useMemo(() => Gesture.Pan().minDistance(4).onBegin(() => { isDragging.value = true; }).onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY; }).onEnd((event) => { runOnJS(onDrop)(item.id, { x: event.absoluteX, y: event.absoluteY }); }).onFinalize(() => { isDragging.value = false; translateX.value = withSpring(0); translateY.value = withSpring(0); }), [isDragging, item.id, onDrop, translateX, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: isDragging.value ? 1.08 : 1 }], zIndex: isDragging.value ? 1 : 0 }));
  return <GestureDetector gesture={panGesture}><Animated.View style={animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={`Kéo ${item.glyph} vào ô trống hoặc chọn để đặt`} accessibilityState={{ selected }} onPress={onPress} style={[styles.letterTile, selected && styles.letterTileSelected]}><Text style={styles.letterText}>{item.glyph}</Text></Pressable></Animated.View></GestureDetector>;
}

const styles = StyleSheet.create({
  sequence: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  glyphCell: { minWidth: 72, minHeight: 72, borderRadius: 18, backgroundColor: namyColors.surface.calm, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: namyColors.border.default },
  gap: { minWidth: 72, minHeight: 72, borderRadius: 18, backgroundColor: namyColors.surface.raised, alignItems: "center", justifyContent: "center", borderWidth: 2, borderStyle: "dashed", borderColor: namyColors.brand.info },
  filledGap: { borderStyle: "solid", backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.border.strong },
  lockMarker: { position: "absolute", top: 4, right: 7, color: namyColors.text.primary, fontSize: 15, fontWeight: "900" },
  glyph: { color: namyColors.text.primary, fontSize: 16, fontWeight: "800" },
  visualText: { color: namyColors.text.secondary, fontSize: 14, lineHeight: 20, marginTop: 16 },
  helper: { color: namyColors.text.primary, fontSize: 15, lineHeight: 22, marginTop: 16, textAlign: "center" },
  tray: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 18 },
  letterTile: { minHeight: 62, minWidth: 92, borderRadius: 20, backgroundColor: namyColors.brand.accent, borderWidth: 1, borderColor: namyColors.border.strong, justifyContent: "center", alignItems: "center", padding: 12 },
  letterTileSelected: { backgroundColor: namyColors.brand.info, transform: [{ translateY: -4 }] },
  letterText: { color: namyColors.text.primary, fontSize: 16, fontWeight: "900" },
  microFeedback: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 9, marginTop: 14 },
  microCorrect: { backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.state.correct },
  microRetry: { backgroundColor: namyColors.state.retrySurface, borderColor: namyColors.state.retry },
  microMarker: { color: namyColors.text.primary, fontSize: 18, fontWeight: "900" },
  microText: { color: namyColors.text.primary, fontSize: 15, fontWeight: "800" },
  completion: { color: namyColors.text.primary, fontSize: 22, lineHeight: 30, fontWeight: "800", fontFamily: namyTypography.child.title },
  completionCard: { alignItems: "center", paddingVertical: 36 },
  safeNotice: { color: namyColors.text.secondary, fontSize: 14, lineHeight: 20, marginTop: 16, paddingHorizontal: 6 },
});
