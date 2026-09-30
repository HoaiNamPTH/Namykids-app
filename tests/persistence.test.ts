import { describe, expect, it } from "vitest";
import type { SessionSnapshot } from "../src/persistence/contracts";
import { assertPrivacySafePersistence, JsonSessionSnapshotRepository, sessionSnapshotKey } from "../src/persistence/contracts";
import { makeMissingLettersConfig } from "./fixtures/missingLetters";

const snapshot: SessionSnapshot = {
  parentUserId: "00000000-0000-0000-0000-000000000001",
  pin: {
    childId: "00000000-0000-0000-0000-000000000002",
    activityId: "alphabet-missing-letters",
    activityVersion: "1.0.0",
    contentReleaseId: "00000000-0000-0000-0000-000000000003",
    nodeVersionId: "00000000-0000-0000-0000-000000000004",
    engineType: "E02_DRAG_DROP"
  },
  state: { phase: "ACTIVE", attemptCount: 1, assisted: false },
  startedAt: "2026-09-25T00:00:00.000Z",
  activityState: { config: makeMissingLettersConfig(), positions: [1, 3, 5], placed: { 1: "glyph-02" } },
};

describe("local persistence contract", () => {
  it("keys a session by parent, child, release, and activity version", () => {
    expect(sessionSnapshotKey(snapshot)).toContain("00000000-0000-0000-0000-000000000001");
    expect(sessionSnapshotKey(snapshot)).toContain("00000000-0000-0000-0000-000000000002");
    expect(sessionSnapshotKey(snapshot)).toContain("1.0.0");
  });

  it("rejects tokens and PII-like values from arbitrary local payloads", () => {
    expect(() => assertPrivacySafePersistence(snapshot)).not.toThrow();
    expect(() => assertPrivacySafePersistence({ authToken: "not-allowed" })).toThrow("authToken");
    expect(() => assertPrivacySafePersistence({ child: { nickname: "not-allowed" } })).toThrow("nickname");
  });

  it("discovers and clears the active snapshot without knowing the current published release", async () => {
    const values = new Map<string, string>();
    const repository = new JsonSessionSnapshotRepository({
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => { values.set(key, value); },
      removeItem: async (key) => { values.delete(key); },
    });
    await repository.save(snapshot);
    await expect(repository.loadActive(snapshot.parentUserId, snapshot.pin.childId, snapshot.pin.activityId)).resolves.toMatchObject({ pin: snapshot.pin });
    await repository.clear(snapshot);
    await expect(repository.loadActive(snapshot.parentUserId, snapshot.pin.childId, snapshot.pin.activityId)).resolves.toBeNull();
  });
});
