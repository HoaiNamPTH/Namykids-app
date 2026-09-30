import type { AlphabetMissingLettersConfig } from "../../content/missing-letters/schema";

export type RoundItem = { id: string; glyph: string; position: number };

export type DropTargetRect = { x: number; y: number; width: number; height: number };

/** Builds the E02 payload from the content configuration without hard-coding an answer set. */
export function createActivityRound(config: AlphabetMissingLettersConfig, positions: readonly number[]) {
  const items: RoundItem[] = positions.map((position) => ({
    id: `round-item-${position}`,
    glyph: config.visibleSequence[position] ?? "glyph",
    position
  }));
  return {
    items: [...items].reverse(),
    config: {
      ...config,
      missingPositions: [...positions],
      trayItems: items.map((item) => ({ id: item.id, glyph: item.glyph, accessibilityLabel: `Chữ ${item.glyph}` })),
      dropTargets: items.map((item) => ({
        id: `round-target-${item.position}`,
        position: item.position,
        expectedTrayItemId: item.id,
        accessibilityLabel: `Ô trống ${item.position + 1}`
      }))
    }
  };
}

export function isPointInsideDropTarget(point: { x: number; y: number }, target: DropTargetRect): boolean {
  return point.x >= target.x && point.x <= target.x + target.width && point.y >= target.y && point.y <= target.y + target.height;
}
