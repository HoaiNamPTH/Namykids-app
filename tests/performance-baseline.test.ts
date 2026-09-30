import { describe, expect, it } from "vitest";
import { makeMissingLettersConfig } from "./fixtures/missingLetters";
import { JsonSessionSnapshotRepository } from "../src/persistence/contracts";
import { reduceGameSession } from "../src/runtime/game-session/reducer";
import { bootstrapRuntime } from "../src/runtime/runtime-bootstrap";
import { createSessionPin, createSessionSnapshot } from "../src/runtime/activity-player/session-snapshot";

const parentUserId = "00000000-0000-0000-0000-0000000000a1";
const childId = "00000000-0000-0000-0000-0000000000b1";

describe("PROVISIONAL synthetic performance baseline", () => {
  it("keeps canonical reducer acknowledgement below the provisional 100 ms budget", () => {
    const config = makeMissingLettersConfig();
    const pin = createSessionPin(childId, config, {
      releaseId: "00000000-0000-0000-0000-0000000000c1",
      nodeVersionId: "00000000-0000-0000-0000-0000000000c2",
      nodeKey: "alphabet-missing-letters",
      engineCode: "E02",
      engineVersion: "1.0.0",
      payload: config,
      contentHash: "fixture",
    });
    const active = reduceGameSession(reduceGameSession({ phase: "IDLE", attemptCount: 0, assisted: false }, { type: "START", pin }), { type: "START", pin });
    const samples = Array.from({ length: 500 }, () => measure(() => reduceGameSession(active, { type: "ATTEMPT", trayItemId: "item-02", targetId: "target-1", correct: true, independentlyAssessable: true })));
    const value = p95(samples);
    console.info(`PERF_PROVISIONAL reducer_ack_p95_ms=${value.toFixed(3)}`);
    expect(value).toBeLessThan(100);
  });

  it("measures cached snapshot save/load without claiming device storage latency", async () => {
    const values = new Map<string, string>();
    const repository = new JsonSessionSnapshotRepository({
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => { values.set(key, value); },
      removeItem: async (key) => { values.delete(key); },
    });
    const config = makeMissingLettersConfig();
    const pin = createSessionPin(childId, config, { releaseId: "00000000-0000-0000-0000-0000000000c1", nodeVersionId: "00000000-0000-0000-0000-0000000000c2", nodeKey: "alphabet-missing-letters", engineCode: "E02", engineVersion: "1.0.0", payload: config, contentHash: "fixture" });
    const snapshot = createSessionSnapshot({ parentUserId, pin, state: { phase: "ACTIVE", pin, attemptCount: 1, assisted: false }, startedAt: "2026-09-30T00:00:00.000Z", config, positions: [1, 3, 5], placed: { 1: "glyph-02" } });
    const samples: number[] = [];
    for (let index = 0; index < 100; index += 1) {
      const started = performance.now();
      await repository.save(snapshot);
      await repository.loadActive(parentUserId, childId, config.activityId);
      samples.push(performance.now() - started);
    }
    const value = p95(samples);
    console.info(`PERF_PROVISIONAL memory_snapshot_roundtrip_p95_ms=${value.toFixed(3)}`);
    expect(value).toBeLessThan(100);
  });

  it("measures cached runtime read-model composition", async () => {
    const samples: number[] = [];
    const gateway = {
      bootstrap: async () => ({ childId, bindingStatus: "active" as const }),
      verifySession: async () => ({ parentUserId }),
      getEntitlement: async () => ({ entitlement: "FULL" as const, sourceRevision: "fixture", effectiveAt: null, expiresAt: null, refreshedAt: null, stale: false }),
      getProgress: async () => ({ progress: [], resume: null }),
    };
    for (let index = 0; index < 100; index += 1) {
      const started = performance.now();
      await bootstrapRuntime(gateway);
      samples.push(performance.now() - started);
    }
    const value = p95(samples);
    console.info(`PERF_PROVISIONAL cached_runtime_composition_p95_ms=${value.toFixed(3)}`);
    expect(value).toBeLessThan(700);
  });
});

function measure(operation: () => unknown): number {
  const started = performance.now();
  operation();
  return performance.now() - started;
}

function p95(samples: readonly number[]): number {
  const ordered = [...samples].sort((left, right) => left - right);
  return ordered[Math.max(0, Math.ceil(ordered.length * 0.95) - 1)] ?? Number.POSITIVE_INFINITY;
}
