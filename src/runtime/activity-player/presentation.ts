import type { AudioCue } from "../../audio/audio-service";
import type { AlphabetMissingLettersConfig } from "../../content/missing-letters/schema";
import type { GameSessionPhase } from "../../domain/types";
import { e02DragDropEngine } from "../../engines/e02-drag-drop/contracts";

export type ActivityPresentationStage = "instruction" | "active" | "complete";

export type PlacementMicroFeedback = {
  kind: "correct" | "retry";
  marker: "check" | "return";
  message: string;
};

export type AutomaticFeedbackTransition =
  | { action: "advance"; audioCue: AudioCue; feedback: PlacementMicroFeedback; isFinalRound: boolean }
  | { action: "request_retry"; audioCue: AudioCue; feedback: PlacementMicroFeedback }
  | { action: "resume_retry" };

export const childCompletionPresentation = {
  title: "Chúc mừng con!",
  actions: ["Chơi mới", "Chơi lại"],
} as const;

export type ChildCompletionAction = (typeof childCompletionPresentation.actions)[number];

export const foundationPreviewPresentation = {
  S01: {
    stateCode: "S01",
    title: "Chào con đến với NamyKids",
    description: "Hôm nay con muốn cùng gấu Nami học bài nào?",
    actions: ["Chữ cái & vần", "Góc của ba mẹ"],
  },
  S02: {
    stateCode: "S02",
    title: "Chữ cái & vần",
    description: "Cùng làm quen và sắp xếp các chữ cái thật vui nhé!",
    actions: ["Bắt đầu chơi", "Quay lại"],
  },
  S03: {
    stateCode: "S03",
    title: "Kéo chữ vào ô trống",
    description: "Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ nhé!",
    actions: ["Nghe lại hướng dẫn", "Bắt đầu"],
    audioFallback: "Giọng đọc mẫu đang chuẩn bị; con hãy nhìn hình và làm theo nhé!",
  },
  S04: {
    stateCode: "S04",
    title: "Chữ cái còn thiếu",
    description: "Kéo thẻ chữ vào ô trống, hoặc chọn thẻ rồi chạm ô trống.",
    idleHelper: "Kéo hoặc chọn một thẻ chữ bên dưới.",
    actions: ["Gợi ý", "Lượt mới"],
  },
  S07: childCompletionPresentation,
  S08: {
    stateCode: "S08",
    title: "Đang mở bài học...",
    description: "Bé chờ một chút xíu nhé, trò chơi sắp sẵn sàng rồi!",
  },
  S09: {
    stateCode: "S09",
    title: "Chưa có kết nối mạng",
    description: "Bài học của bé vẫn được giữ lại an toàn. Khi có mạng trở lại, ứng dụng sẽ tự động cập nhật nhé!",
    actions: ["Quay lại bài học", "Góc của ba mẹ"],
  },
  S10: {
    stateCode: "S10",
    eyebrow: "NamyKids / Dành cho ba mẹ",
    title: "Góc của ba mẹ",
    description: "Theo dõi tiến độ học tập thực tế của bé một cách rõ ràng và chuẩn xác.",
    detailLabels: ["Tự làm đúng", "Thử và tự sửa", "Có gợi ý trợ giúp"],
    action: "Quay lại không gian của bé",
  },
  S11: {
    stateCode: "S11",
    title: "Bài học đang chuẩn bị",
    description: "Bài học này tạm thời chưa mở. Bé hãy chọn các bài học vui khác đang sẵn sàng nhé!",
    action: "Về trang chủ",
  },
  S12: {
    stateCode: "S12",
    title: "Mình đang giữ mọi thứ an toàn",
    description: "Đã có chút gián đoạn nhỏ, nhưng mọi tiến độ của bé vẫn được lưu lại an toàn. Ba mẹ hãy thử tải lại nhé!",
    actions: ["Tải lại trang", "Về trang chủ"],
  },
} as const;

export const foundationPreviewAccessibility = {
  hintAvailable: "Mở một ô chữ giúp con",
  hintUnavailable: "Nút gợi ý sẽ mở khi con cần trợ giúp",
  refreshHint: "Đổi một bộ vị trí chữ khuyết khác",
  dropTargetHint: "Chạm sau khi chọn thẻ, hoặc kéo thả thẻ vào đây",
} as const;

export function selectedLetterHelper(glyph: string): string {
  return `Đã chọn ${glyph}. Con hãy chạm một ô trống.`;
}

export function foundationParentSummaryCopy(summary: {
  correctPlacements: number;
  independentCorrectPlacements: number;
  trialAndErrorCorrectPlacements: number;
  assistedCorrectPlacements: number;
}): readonly string[] {
  const labels = foundationPreviewPresentation.S10.detailLabels;
  return [
    `Lượt chơi vừa hoàn thành: ${summary.correctPlacements} ô chữ đã điền đúng.`,
    `• ${labels[0]}: ${summary.independentCorrectPlacements} chữ`,
    `• ${labels[1]}: ${summary.trialAndErrorCorrectPlacements} chữ`,
    `• ${labels[2]}: ${summary.assistedCorrectPlacements} chữ`,
  ];
}

export function positionsForCompletionAction(
  action: ChildCompletionAction,
  config: AlphabetMissingLettersConfig,
  currentPositions: readonly number[],
): readonly number[] {
  return action === "Chơi mới"
    ? e02DragDropEngine.selectRefreshPositions(config, currentPositions)
    : [...currentPositions];
}

export function activityPresentationStage(phase: GameSessionPhase): ActivityPresentationStage {
  if (phase === "ROUND_COMPLETE" || phase === "COMPLETING" || phase === "COMPLETED") return "complete";
  if (phase === "IDLE" || phase === "INTRO") return "instruction";
  return "active";
}

export function automaticFeedbackTransition(
  phase: GameSessionPhase,
  isFinalRound: boolean,
): AutomaticFeedbackTransition | null {
  if (phase === "FEEDBACK_POSITIVE") {
    return {
      action: "advance",
      audioCue: isFinalRound ? "completion" : "correct",
      feedback: {
        kind: "correct",
        marker: "check",
        message: isFinalRound ? childCompletionPresentation.title : "Con làm đúng rồi",
      },
      isFinalRound,
    };
  }
  if (phase === "FEEDBACK_NEGATIVE") {
    return {
      action: "request_retry",
      audioCue: "retry",
      feedback: { kind: "retry", marker: "return", message: "Con thử lại nhé" },
    };
  }
  if (phase === "RETRY") return { action: "resume_retry" };
  return null;
}
