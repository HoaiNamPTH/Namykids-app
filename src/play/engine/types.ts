import type { ColorId } from "../colors";
import type { ItemId } from "../items";

/** What a card shows: a 3D picture (optionally drawn small, e.g. a baby animal) or a big letter. */
export type Where = "tren" | "duoi" | "trong" | "canh";
export type Pic =
  | { item: ItemId; small?: boolean }
  | { glyph: string }
  /** A glossy colour bead (Colour and Art groups). */
  | { color: ColorId }
  /** An uncoloured picture waiting to be painted (grey silhouette). */
  | { item: ItemId; blank: true }
  /** A plain sign between cards, e.g. "+" and "=" in colour mixing. */
  | { sign: string }
  /** A small picture placed on / under / in / beside a bigger one (positions game). */
  | { item: ItemId; on: ItemId; where: Where };

/** A tappable / draggable card. `say` is spoken when the child touches it after answering. */
export type Card = { id: string; pic: Pic; say: string; /** Picture shown once the card is solved (e.g. the painted picture). */ done?: Pic };

/** Listen-and-choose and tap-select: tap the right card(s). */
export type ChooseRound = {
  kind: "choose";
  prompt: string;
  /** A few words shown on screen; the voice still says the full prompt. Falls back to the game's short line. */
  short?: string;
  cards: Card[];
  answers: string[];
  /** Picture shown big on the left instead of the speaker (e.g. the word being clapped). */
  scene?: Pic;
  /** Spoken after the round is solved. */
  praise: string;
  /** A real sound (e.g. the animal's call) played right after the prompt and again after the praise. */
  sound?: ItemId;
};

/** Match pairs: tap a top card, then its partner in the bottom row. */
export type MatchRound = {
  kind: "match";
  prompt: string;
  short?: string;
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
  short?: string;
  cells: Cell[];
  tray: Card[];
  /** Picture shown above the row (for "first letter of the picture"). */
  scene?: Pic;
  /** Sequence mode: tapping a card puts it in the next empty gap. */
  inOrder?: boolean;
  /** Draw the row on a cord, like beads on a necklace. */
  strung?: boolean;
  praise: string;
};

/** Flip cards: turn two face-down cards; cards with the same `pair` stay open. */
export type FlipCard = Card & { pair: string };
export type FlipRound = {
  kind: "flip";
  prompt: string;
  short?: string;
  cards: FlipCard[];
  praise: string;
};

export type Round = ChooseRound | MatchRound | FillRound | FlipRound;

export type Level = 0 | 1 | 2;
export const LEVEL_NAMES = ["Dễ", "Vừa", "Khó"] as const;

export type Rng = () => number;

export type GameContent = {
  /** Rounds for one play at the given level. */
  rounds: (level: Level, rng: Rng) => Round[];
};
