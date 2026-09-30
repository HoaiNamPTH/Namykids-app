import { describe, expect, it } from "vitest";
import { makeMissingLettersConfig } from "./fixtures/missingLetters";
import { createSessionPin, createSessionSnapshot, restorePinnedActivitySession } from "../src/runtime/activity-player/session-snapshot";
import { assessRoundPlacement, createRoundAssessment } from "../src/runtime/activity-player/round-assessment";

const parentUserId = "00000000-0000-0000-0000-0000000000a1";
const childId = "00000000-0000-0000-0000-0000000000b1";

describe("pinned activity session snapshots", () => {
  it("restores the original release and node pin even when a newer pin could exist", () => {
    const config = makeMissingLettersConfig();
    const pin = createSessionPin(childId, config, {
      releaseId: "00000000-0000-0000-0000-0000000000c1",
      nodeVersionId: "00000000-0000-0000-0000-0000000000c2",
      nodeKey: "alphabet-missing-letters",
      engineCode: "E02",
      engineVersion: "1.0.0",
      payload: config,
      contentHash: "old-pin-hash",
    });
    const snapshot = createSessionSnapshot({
      parentUserId,
      pin,
      state: { phase: "ACTIVE", pin, attemptCount: 1, assisted: false },
      startedAt: "2026-09-25T00:00:00.000Z",
      config,
      positions: [1, 3, 5],
      placed: { 1: "glyph-02" },
      assessment: assessRoundPlacement(createRoundAssessment(), {
        itemId: "item-02",
        targetId: "target-03",
        correct: false,
        answerRevealed: false,
        engineIndependentlyAssessable: false,
      }).state,
    });

    expect(restorePinnedActivitySession(snapshot, parentUserId, childId)).toMatchObject({
      pin: { contentReleaseId: pin.contentReleaseId, nodeVersionId: pin.nodeVersionId, contentHash: "old-pin-hash" },
      activityState: { placed: { 1: "glyph-02" }, assessment: { wrongItemIds: ["item-02"], wrongTargetIds: ["target-03"] } },
    });
  });

  it("fails closed for independent evidence when restoring a legacy snapshot without assessment history", () => {
    const config = makeMissingLettersConfig();
    const pin = createSessionPin(childId, config, {
      releaseId: "00000000-0000-0000-0000-0000000000c1",
      nodeVersionId: "00000000-0000-0000-0000-0000000000c2",
      nodeKey: "alphabet-missing-letters",
      engineCode: "E02",
      engineVersion: "1.0.0",
      payload: config,
      contentHash: "legacy-pin-hash",
    });
    const snapshot = createSessionSnapshot({ parentUserId, pin, state: { phase: "ACTIVE", pin, attemptCount: 1, assisted: false }, startedAt: "2026-09-25T00:00:00.000Z", config, positions: [1, 3, 5], placed: {} });
    delete snapshot.activityState.assessment;

    expect(restorePinnedActivitySession(snapshot, parentUserId, childId)).toMatchObject({
      activityState: { assessment: { historyComplete: false } },
    });
  });

  it("rejects a snapshot whose round positions were not part of the pinned config", () => {
    const config = makeMissingLettersConfig();
    const pin = createSessionPin(childId, config, {
      releaseId: "00000000-0000-0000-0000-0000000000c1",
      nodeVersionId: "00000000-0000-0000-0000-0000000000c2",
      nodeKey: "alphabet-missing-letters",
      engineCode: "E02",
      engineVersion: "1.0.0",
      payload: config,
      contentHash: "pin-hash",
    });
    const snapshot = createSessionSnapshot({ parentUserId, pin, state: { phase: "ACTIVE", pin, attemptCount: 0, assisted: false }, startedAt: "2026-09-25T00:00:00.000Z", config, positions: [0, 1, 2], placed: {} });
    expect(restorePinnedActivitySession(snapshot, parentUserId, childId)).toBeNull();
  });
});
