import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { unavailableAudioService, type AudioCue } from "../audio/audio-service";
import { firstSliceDevConfig } from "../content/missing-letters/first-slice-dev-config";
import type { SessionPin } from "../domain/types";
import { e02DragDropEngine, type E02InputMode } from "../engines/e02-drag-drop/contracts";
import { createActivityRound, isPointInsideDropTarget, type DropTargetRect, type RoundItem } from "../runtime/activity-player/activity-round";
import { automaticFeedbackTransition, childCompletionPresentation, positionsForCompletionAction, type PlacementMicroFeedback } from "../runtime/activity-player/presentation";
import { assessRoundPlacement, createRoundAssessment, isHintEligible, revealHintForRound, summarizeRoundAssessment, type RoundAssessmentState } from "../runtime/activity-player/round-assessment";
import { idleGameSession, reduceGameSession } from "../runtime/game-session/reducer";
import { namyColors, namyTypography } from "../ui/brand-tokens";
import { DevAssetNotice, NamyScene, SceneAction, SceneCard } from "../ui/NamyScene";

type PreviewScreen = "S01" | "S02" | "S03" | "S04" | "S07" | "S09" | "S10" | "S11" | "S12";
type TargetRects = Readonly<Record<number, DropTargetRect>>;

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
  const [completed, setCompleted] = useState(false);
  const targetRects = useRef<TargetRects>({});
  const assessmentRef = useRef(assessment);
  const round = useMemo(() => createActivityRound(firstSliceDevConfig, positions), [positions]);
  const selected = round.items.find((item) => item.id === selectedId) ?? null;
  const allPlaced = positions.every((position) => placed[position] !== undefined);
  const hintEligible = isHintEligible(assessment);
  const summary = summarizeRoundAssessment(assessment);
  const lastPlacement = assessment.placements[assessment.placements.length - 1];

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
    setCompleted(false);
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
        setCompleted(true);
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

  const banner = <PreviewBanner />;

  if (screen === "S01") return <NamyScene stateCode="DEV / S01" title="Chào con đến với NamyKids" description="Foundation Preview dùng fixture cục bộ để User Acceptance; không tạo phiên Auth hoặc tiến độ canonical.">
    {banner}<SceneCard><SceneAction label="Chữ cái & vần" onPress={() => setScreen("S02")} tone="leaf" /><SceneAction label="Góc của ba mẹ" onPress={() => setScreen("S10")} tone="paper" /></SceneCard>
    <SceneCard><DevAssetNotice /><SceneAction label="Xem Restricted" onPress={() => setScreen("S11")} tone="paper" /><SceneAction label="Xem Safe Recovery" onPress={() => setScreen("S12")} tone="paper" /></SceneCard>
  </NamyScene>;

  if (screen === "S02") return <NamyScene stateCode="DEV / S02" title="Chữ cái & vần" description="Đi theo một hành trình nhỏ để làm quen với thứ tự chữ cái.">
    {banner}<SceneCard><DevAssetNotice compact /><SceneAction label="Bắt đầu lượt Missing Letters" onPress={() => resetRound("S03")} tone="leaf" /><SceneAction label="Ngoại tuyến / đồng bộ an toàn" onPress={() => setScreen("S09")} tone="paper" /><SceneAction label="Quay về Child World" onPress={() => setScreen("S01")} tone="paper" /></SceneCard>
  </NamyScene>;

  if (screen === "S03") return <NamyScene stateCode="DEV / S03" title="Kéo chữ vào ô trống" description="Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ.">
    {banner}<SceneCard><PreviewSequence sequence={firstSliceDevConfig.visibleSequence} positions={positions} placed={{}} /><Text style={styles.note}>Hình và voice đang là DEV_PLACEHOLDER; đáp án chưa được tiết lộ.</Text></SceneCard>
    <SceneAction label="Nghe lại hướng dẫn" onPress={() => setAudioNotice("Voice asset là DEV_PLACEHOLDER; hướng dẫn chữ và hình vẫn hoạt động.")} tone="paper" />
    <SceneAction label="Bắt đầu" onPress={startActivity} tone="leaf" />{audioNotice ? <Text style={styles.notice}>{audioNotice}</Text> : null}
  </NamyScene>;

  if (screen === "S07") return <NamyScene minimal stateCode="DEV / S07" title={childCompletionPresentation.title}>
    <SceneAction label={childCompletionPresentation.actions[0]} onPress={startNewRound} tone="leaf" />
    <SceneAction label={childCompletionPresentation.actions[1]} onPress={replayRound} tone="paper" />
  </NamyScene>;

  if (screen === "S09") return <NamyScene stateCode="DEV / S09" title="Ngoại tuyến / đồng bộ an toàn" description="Preview dùng state in-memory cô lập; không enqueue durable outbox và không gọi remote runtime.">
    {banner}<SceneCard><Text style={styles.note}>{completed ? "Completion presentation đang được giữ trong preview state." : "Chưa có lượt preview hoàn thành."}</Text><SceneAction label="Góc của ba mẹ" onPress={() => setScreen("S10")} tone="leaf" /><SceneAction label="Về Child World" onPress={() => setScreen("S01")} tone="paper" /></SceneCard>
  </NamyScene>;

  if (screen === "S10") return <NamyScene calm stateCode="DEV / S10" eyebrow="NamyKids / Parent" title="Góc của ba mẹ" description="Chỉ hiển thị summary của preview in-memory, không giả lập phần trăm hay mastery.">
    {banner}<SceneCard><Text style={styles.note}>{completed ? `Lượt preview hoàn thành: ${summary.correctPlacements} placement đúng.` : "Chưa có lượt preview hoàn thành."}</Text><Text style={styles.note}>Independent {summary.independentCorrectPlacements}; trial-and-error {summary.trialAndErrorCorrectPlacements}; assisted {summary.assistedCorrectPlacements}.</Text><SceneAction label="Quay lại Child World" onPress={() => setScreen("S01")} tone="leaf" /></SceneCard>
  </NamyScene>;

  if (screen === "S11") return <NamyScene stateCode="DEV / S11" title="Nội dung cần quyền truy cập đầy đủ" description="Presentation-only state để nghiệm thu Restricted; preview không thay entitlement production.">
    {banner}<SceneCard><SceneAction label="Về Child World" onPress={() => setScreen("S01")} tone="leaf" /><SceneAction label="Xem Safe Recovery" onPress={() => setScreen("S12")} tone="paper" /></SceneCard>
  </NamyScene>;

  if (screen === "S12") return <NamyScene stateCode="DEV / S12" title="Mình đang giữ mọi thứ an toàn" description="Presentation-only recovery; không tạo fake binding, token hoặc canonical outbox.">
    {banner}<SceneCard><SceneAction label="Về Child World" onPress={() => setScreen("S01")} tone="leaf" /><SceneAction label="Xem Offline / Sync" onPress={() => setScreen("S09")} tone="paper" /></SceneCard>
  </NamyScene>;

  return <NamyScene scrollEnabled={false} stateCode="DEV / S04" title="Chữ cái còn thiếu" description="Kéo một thẻ vào ô trống, hoặc chọn thẻ rồi chạm ô trống.">
    {banner}<SceneCard><PreviewSequence sequence={firstSliceDevConfig.visibleSequence} positions={positions} placed={placed} selected={selected?.glyph ?? null} onTargetPress={selectThenPlace} onTargetMeasured={(position, rect) => { targetRects.current = { ...targetRects.current, [position]: rect }; }} /><Text style={styles.helper}>{selected ? `Đã chọn ${selected.glyph}. Chọn một ô trống.` : "Kéo hoặc chọn một thẻ chữ bên dưới."}</Text></SceneCard>
    {microFeedback ? <View accessibilityLiveRegion="polite" style={[styles.microFeedback, microFeedback.kind === "correct" ? styles.microCorrect : styles.microRetry]}><Text accessible={false} style={styles.microMarker}>{microFeedback.marker === "check" ? "✓" : "↩"}</Text><Text style={styles.microText}>{microFeedback.message}</Text><Text style={styles.evidenceText}>{lastPlacement?.independentlyAssessable ? "Independent" : lastPlacement?.answerRevealed ? "Assisted" : "Trial-and-error · non-independent"}</Text></View> : null}
    <View style={styles.tray}>{round.items.filter((item) => placed[item.position] === undefined).map((item) => <PreviewLetterTile key={item.id} item={item} selected={selectedId === item.id} onPress={() => setSelectedId(item.id)} onDrop={handleDrop} />)}</View>
    <SceneAction label="Gợi ý" onPress={revealHint} tone="paper" disabled={!hintEligible} accessibilityHint={hintEligible ? "Reveal một đáp án và đánh dấu assisted" : "Mở sau một genuine incorrect placement"} />
    <SceneAction label="Lượt mới" onPress={refreshRound} tone="paper" disabled={Object.keys(placed).length > 0} />
  </NamyScene>;
}

function PreviewBanner() {
  return <View style={styles.banner}><Text style={styles.bannerTitle}>DEV-ONLY FOUNDATION PREVIEW</Text><Text style={styles.bannerText}>Fixture + in-memory state · no Auth · no DB · no Completion Commit</Text><Text style={styles.bannerText}>Typography candidate: {namyTypography.previewCandidateLabel}. Chưa phải final baseline.</Text><Text style={styles.bannerText}>Color tokens: official Step 8 logo + approved Soft CGI visual.</Text></View>;
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
  return <View ref={targetRef} onLayout={measureTarget}><Pressable accessibilityRole="button" accessibilityLabel={`Ô trống ${position + 1}${filled ? ", chữ đã khóa đúng vị trí" : selected ? `, đặt ${selected}` : ""}`} onPress={() => onPress?.(position)} style={[styles.gap, filled && styles.filledGap]}>{filled ? <Text accessible={false} style={styles.lockMarker}>✓</Text> : null}<Text style={styles.glyph}>{content}</Text></Pressable></View>;
}

function PreviewLetterTile({ item, selected, onPress, onDrop }: { item: RoundItem; selected: boolean; onPress: () => void; onDrop: (itemId: string, point: { x: number; y: number }) => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);
  const gesture = useMemo(() => Gesture.Pan().minDistance(4).onBegin(() => { dragging.value = true; }).onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY; }).onEnd((event) => { runOnJS(onDrop)(item.id, { x: event.absoluteX, y: event.absoluteY }); }).onFinalize(() => { dragging.value = false; translateX.value = withSpring(0); translateY.value = withSpring(0); }), [dragging, item.id, onDrop, translateX, translateY]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: dragging.value ? 1.08 : 1 }] }));
  return <GestureDetector gesture={gesture}><Animated.View style={animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={`Kéo ${item.glyph} vào ô trống hoặc chọn để đặt`} accessibilityState={{ selected }} onPress={onPress} style={[styles.tile, selected && styles.tileSelected]}><Text style={styles.tileText}>{item.glyph}</Text></Pressable></Animated.View></GestureDetector>;
}

const styles = StyleSheet.create({
  banner: { borderRadius: 16, borderWidth: 1, borderColor: namyColors.border.default, backgroundColor: namyColors.surface.subtle, padding: 12, marginTop: 18 },
  bannerTitle: { color: namyColors.text.primary, fontSize: 12, fontWeight: "900", letterSpacing: 0.7 },
  bannerText: { color: namyColors.text.secondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  sequence: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  glyphCell: { minWidth: 72, minHeight: 72, borderRadius: 18, backgroundColor: namyColors.surface.calm, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: namyColors.border.default },
  gap: { minWidth: 72, minHeight: 72, borderRadius: 18, backgroundColor: namyColors.surface.raised, alignItems: "center", justifyContent: "center", borderWidth: 2, borderStyle: "dashed", borderColor: namyColors.brand.info },
  filledGap: { borderStyle: "solid", backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.border.strong },
  lockMarker: { position: "absolute", top: 4, right: 7, color: namyColors.text.primary, fontSize: 15, fontWeight: "900" },
  glyph: { color: namyColors.text.primary, fontSize: 16, fontWeight: "800" },
  helper: { color: namyColors.text.primary, fontSize: 15, lineHeight: 22, marginTop: 16, textAlign: "center" },
  tray: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 18 },
  tile: { minHeight: 62, minWidth: 92, borderRadius: 20, backgroundColor: namyColors.brand.accent, borderWidth: 1, borderColor: namyColors.border.strong, justifyContent: "center", alignItems: "center", padding: 12 },
  tileSelected: { backgroundColor: namyColors.brand.info, transform: [{ translateY: -4 }] },
  tileText: { color: namyColors.text.primary, fontSize: 16, fontWeight: "900" },
  microFeedback: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 9, marginTop: 14 },
  microCorrect: { backgroundColor: namyColors.state.correctSurface, borderColor: namyColors.state.correct },
  microRetry: { backgroundColor: namyColors.state.retrySurface, borderColor: namyColors.state.retry },
  microMarker: { color: namyColors.text.primary, fontSize: 18, fontWeight: "900" },
  microText: { color: namyColors.text.primary, fontSize: 15, fontWeight: "800" },
  evidenceText: { color: namyColors.text.secondary, fontSize: 11, fontWeight: "700" },
  note: { color: namyColors.text.secondary, fontSize: 14, lineHeight: 20, marginTop: 12 },
  notice: { color: namyColors.text.secondary, fontSize: 14, lineHeight: 20, marginTop: 16 },
});
