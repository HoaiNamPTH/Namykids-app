import { describe, expect, it } from "vitest";
import { e02DragDropEngine } from "../src/engines/e02-drag-drop/contracts";
import { createActivityRound, isPointInsideDropTarget } from "../src/runtime/activity-player/activity-round";
import { firstSliceDevConfig } from "../src/content/missing-letters/first-slice-dev-config";

describe("Missing Letters activity round", () => {
  it("builds the baseline three configured gaps and evaluates a pointer drag", () => {
    const round = createActivityRound(firstSliceDevConfig, [1, 3, 5]);
    expect(round.items.map((item) => item.position)).toEqual([5, 3, 1]);

    const item = round.items[0]!;
    const target = round.config.dropTargets.find((candidate) => candidate.expectedTrayItemId === item.id);
    expect(target).toBeDefined();
    expect(e02DragDropEngine.evaluateDrop(round.config, {
      trayItemId: item.id,
      targetId: target!.id,
      inputMode: "drag",
      answerRevealed: false
    })).toMatchObject({ accepted: true, correct: true, independentlyAssessable: true });
  });

  it("keeps wrong drag as gentle retry and supports select-then-place", () => {
    const round = createActivityRound(firstSliceDevConfig, [1, 3, 5]);
    expect(e02DragDropEngine.evaluateDrop(round.config, {
      trayItemId: "round-item-1",
      targetId: "round-target-3",
      inputMode: "drag",
      answerRevealed: false
    })).toMatchObject({ accepted: false, feedback: "gentle_retry" });
    expect(e02DragDropEngine.evaluateDrop(round.config, {
      trayItemId: "round-item-1",
      targetId: "round-target-1",
      inputMode: "select_then_place",
      answerRevealed: true
    })).toMatchObject({ independentlyAssessable: false });
  });

  it("recognizes only pointer releases inside the measured drop target", () => {
    const target = { x: 20, y: 40, width: 72, height: 72 };
    expect(isPointInsideDropTarget({ x: 56, y: 76 }, target)).toBe(true);
    expect(isPointInsideDropTarget({ x: 110, y: 76 }, target)).toBe(false);
  });
});
