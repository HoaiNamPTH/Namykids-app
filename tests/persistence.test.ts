import { describe, expect, it } from "vitest";
import type { SessionSnapshot } from "../src/persistence/contracts";
import { assertPrivacySafePersistence, sessionSnapshotKey } from "../src/persistence/contracts";

const snapshot: SessionSnapshot = {
  parentUserId: "00000000-0000-0000-0000-000000000001",
  pin: {
    childId: "00000000-0000-0000-0000-000000000002",
    activityId: "alphabet-missing-letters",
    activityVersion: "1.0.0",
    contentReleaseId: "00000000-0000-0000-0000-000000000003",
    engineType: "E02_DRAG_DROP"
  },
  state: { phase: "ACTIVE", attemptCount: 1, assisted: false },
  startedAt: "2026-09-25T00:00:00.000Z"
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
});
