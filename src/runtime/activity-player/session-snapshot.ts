import { alphabetMissingLettersConfigSchema, signature, type AlphabetMissingLettersConfig } from "../../content/missing-letters/schema";
import type { PublishedContentPin } from "../../data/contracts";
import type { GameSessionState, SessionPin } from "../../domain/types";
import type { SessionSnapshot } from "../../persistence/contracts";

export function createSessionPin(childId: string, config: AlphabetMissingLettersConfig, contentPin: PublishedContentPin): SessionPin {
  return {
    childId,
    activityId: config.activityId,
    activityVersion: config.activityVersion,
    contentReleaseId: contentPin.releaseId,
    nodeVersionId: contentPin.nodeVersionId,
    engineType: "E02_DRAG_DROP",
    engineVersion: contentPin.engineVersion,
    contentHash: contentPin.contentHash,
  };
}

export function createSessionSnapshot(input: {
  parentUserId: string;
  pin: SessionPin;
  state: GameSessionState;
  startedAt: string;
  config: AlphabetMissingLettersConfig;
  positions: readonly number[];
  placed: Readonly<Record<number, string>>;
}): SessionSnapshot {
  return {
    parentUserId: input.parentUserId,
    pin: input.pin,
    state: { ...input.state, pin: input.pin },
    startedAt: input.startedAt,
    activityState: {
      config: input.config,
      positions: [...input.positions],
      placed: { ...input.placed },
    },
  };
}

export function restorePinnedActivitySession(snapshot: SessionSnapshot, parentUserId: string, childId: string): SessionSnapshot | null {
  if (snapshot.parentUserId !== parentUserId || snapshot.pin.childId !== childId) return null;
  if (snapshot.pin.activityId !== "alphabet-missing-letters" || snapshot.pin.engineType !== "E02_DRAG_DROP") return null;
  if (!snapshot.pin.contentHash || !snapshot.pin.nodeVersionId || snapshot.state.phase === "IDLE" || snapshot.state.phase === "COMPLETED") return null;
  const parsed = alphabetMissingLettersConfigSchema.safeParse(snapshot.activityState?.config);
  if (!parsed.success || parsed.data.activityId !== snapshot.pin.activityId || parsed.data.activityVersion !== snapshot.pin.activityVersion) return null;
  const allowedPositions = [parsed.data.missingPositions, ...parsed.data.refreshableRoundConfig.alternativeMissingPositionSets]
    .some((positions) => signature(positions) === signature(snapshot.activityState.positions));
  if (!allowedPositions) return null;
  const placedIsValid = Object.entries(snapshot.activityState.placed).every(([position, glyph]) => {
    const index = Number(position);
    return snapshot.activityState.positions.includes(index) && parsed.data.visibleSequence[index] === glyph;
  });
  if (!placedIsValid) return null;
  return {
    ...snapshot,
    state: { ...snapshot.state, pin: snapshot.pin },
    activityState: { ...snapshot.activityState, config: parsed.data },
  };
}
