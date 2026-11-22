import { LANGUAGE_GAMES, type GameMeta } from "./catalog";
import type { Progress } from "./progress";

/**
 * One sticker per game, earned the first time the child finishes the game's Khó level.
 * Interim look: the game's picture on a round badge with a smiling face and a praise word.
 * Final round "smiling object" sticker art replaces the picture later; the praise words stay.
 */
export type Sticker = { gameId: string; praise: string; tint: string; icon: GameMeta["icon"] };

const PRAISE = [
  "Giỏi quá!", "Tuyệt vời!", "Siêu ghê!", "Thông minh!", "Chăm chỉ!", "Khéo tay!", "Nhanh trí!",
  "Cừ lắm!", "Xuất sắc!", "Tài ghê!", "Dũng cảm!", "Kiên nhẫn!", "Tinh mắt!", "Thính tai!",
];
const TINTS = ["#FFD84D", "#FF9EC4", "#8FD8FF", "#9BE58F", "#C9A8FF", "#FFB36B", "#7EE0D2"];

export const STICKERS: Sticker[] = LANGUAGE_GAMES.map((g, i) => ({
  gameId: g.id,
  praise: PRAISE[i % PRAISE.length] ?? "Giỏi quá!",
  tint: TINTS[i % TINTS.length] ?? "#FFD84D",
  icon: g.icon,
}));

/** Khó is level 2, so a sticker needs best >= 3 (three levels completed). */
export const KHO_DONE = 3;

export function stickerFor(gameId: string): Sticker | undefined {
  return STICKERS.find((s) => s.gameId === gameId);
}

export function earnedStickers(p: Progress): Sticker[] {
  return STICKERS.filter((s) => (p.best[s.gameId] ?? 0) >= KHO_DONE);
}
