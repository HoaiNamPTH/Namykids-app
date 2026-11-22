import { LANGUAGE_GAMES } from "../catalog";

/** PO decision 22/11/2026: 7 days of FULL access from sign-up, then LIMITED. */
export const TRIAL_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

/**
 * PLACEHOLDER until the PO picks the free lessons: in LIMITED the child keeps these games.
 * Swap this list when the decision lands; nothing else changes.
 */
export const FREE_GAME_IDS: readonly string[] = ["tim-do-vat", "ai-keu-the", "ban-giong-het", "me-oi-con-dau", "chuyen-cay-con", "nghe-chon-chu"];

/** PLACEHOLDER until the PO sets the price. */
export const PRICE_LABEL = "Giá gói đầy đủ: đang chờ chốt";

export type Plan = "trial" | "full" | "limited";
export type Access = { plan: Plan; daysLeft: number; canPlay: (gameId: string) => boolean };

export function accessFor(trialStart: number, now: number, paid = false): Access {
  if (paid) return { plan: "full", daysLeft: 0, canPlay: () => true };
  const left = Math.max(0, Math.ceil((trialStart + TRIAL_DAYS * DAY - now) / DAY));
  if (left > 0) return { plan: "trial", daysLeft: left, canPlay: () => true };
  return { plan: "limited", daysLeft: 0, canPlay: (id) => FREE_GAME_IDS.includes(id) };
}

export function freeGamesAreReal(): boolean {
  return FREE_GAME_IDS.every((id) => LANGUAGE_GAMES.some((g) => g.id === id));
}

export const DAY_MS = DAY;
