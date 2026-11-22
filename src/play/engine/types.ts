import type { ItemId } from "../items";

/** What a card shows: a 3D picture (optionally drawn small, e.g. a baby animal) or a big letter. */
export type Pic = { item: ItemId; small?: boolean } | { glyph: string };

/** A tappable / draggable card. `say` is spoken when the child touches it after answering. */
export type Card = { id: string; pic: Pic; say: string };

/** Listen-and-choose and tap-select: tap the right card(s). */
export type ChooseRound = {
  kind: "choose";
  prompt: string;
  cards: Card[];
  answers: string[];
  /** Spoken after the round is solved. */
  praise: string;
};

/** Match pairs: tap a top card, then its partner in the bottom row. */
export type MatchRound = {
  kind: "match";
  prompt: string;
  top: Card[];
  bottom: Card[];
  /** top card id -> bottom card id */
  pairs: Record<string, string>;
};

export type Cell = { fixed: Pic; say?: string } | { gap: string; label?: string };

/** Drag-fill and sequence: drag (or tap, then tap the gap) cards from the tray into the gaps. */
export type FillRound = {
  kind: "fill";
  prompt: string;
  cells: Cell[];
  tray: Card[];
  /** Picture shown above the row (for "first letter of the picture"). */
  scene?: Pic;
  /** Sequence mode: tapping a card puts it in the next empty gap. */
  inOrder?: boolean;
  praise: string;
};

export type Round = ChooseRound | MatchRound | FillRound;

export type Level = 0 | 1 | 2;
export const LEVEL_NAMES = ["Dễ", "Vừa", "Khó"] as const;

export type Rng = () => number;

export type GameContent = {
  /** Rounds for one play at the given level. */
  rounds: (level: Level, rng: Rng) => Round[];
};
