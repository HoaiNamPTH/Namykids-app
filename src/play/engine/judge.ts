import type { ChooseRound, FillRound, MatchRound } from "./types";

/** Pure rules shared by the templates. Kept free of UI so they can be tested. */

export function chooseResult(round: ChooseRound, found: readonly string[], tapped: string): "correct" | "done" | "wrong" | "again" {
  if (found.includes(tapped)) return "again";
  if (!round.answers.includes(tapped)) return "wrong";
  return found.length + 1 >= round.answers.length ? "done" : "correct";
}

export function matchResult(round: MatchRound, matched: readonly string[], topId: string, bottomId: string): "correct" | "done" | "wrong" {
  if (round.pairs[topId] !== bottomId) return "wrong";
  return matched.length + 1 >= Object.keys(round.pairs).length ? "done" : "correct";
}

export function gapIds(round: FillRound): string[] {
  return round.cells.flatMap((c, i) => ("gap" in c ? [String(i)] : []));
}

/** Can tray card `cardId` go into cell index `cellIndex`? */
export function fillFits(round: FillRound, cellIndex: number, cardId: string): boolean {
  const cell = round.cells[cellIndex];
  return !!cell && "gap" in cell && cell.gap === cardId;
}

/** For in-order (sequence) play: the first still-empty gap. */
export function nextGap(round: FillRound, filled: Readonly<Record<number, string>>): number | null {
  const i = round.cells.findIndex((c, idx) => "gap" in c && filled[idx] === undefined);
  return i < 0 ? null : i;
}

export function fillDone(round: FillRound, filled: Readonly<Record<number, string>>): boolean {
  return round.cells.every((c, idx) => !("gap" in c) || filled[idx] !== undefined);
}
