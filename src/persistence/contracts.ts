import type { CompletionCommitRequest, GameSessionState, Uuid } from "../domain/types";

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type SessionSnapshot = {
  parentUserId: Uuid;
  pin: NonNullable<GameSessionState["pin"]>;
  state: GameSessionState;
  startedAt: string;
};

export type PendingCompletion = {
  completionId: Uuid;
  parentUserId: Uuid;
  childId: Uuid;
  activityId: string;
  activityVersion: string;
  contentReleaseId: Uuid;
  request: CompletionCommitRequest;
  queuedAt: string;
};

export interface SessionSnapshotRepository {
  load(key: string): Promise<SessionSnapshot | null>;
  save(snapshot: SessionSnapshot): Promise<void>;
  clear(key: string): Promise<void>;
}

export interface PendingCompletionRepository {
  enqueue(record: PendingCompletion): Promise<void>;
  list(parentUserId: Uuid, childId: Uuid): Promise<readonly PendingCompletion[]>;
  remove(record: Pick<PendingCompletion, "parentUserId" | "childId" | "completionId">): Promise<void>;
}

export function sessionSnapshotKey(snapshot: Pick<SessionSnapshot, "parentUserId" | "pin">): string {
  const { parentUserId, pin } = snapshot;
  return ["namykids", "session", parentUserId, pin.childId, pin.contentReleaseId, pin.activityId, pin.activityVersion].join(":");
}

export function pendingCompletionKey(record: Pick<PendingCompletion, "parentUserId" | "childId" | "completionId">): string {
  return ["namykids", "outbox", record.parentUserId, record.childId, record.completionId].join(":");
}

function pendingCompletionIndexKey(record: Pick<PendingCompletion, "parentUserId" | "childId">): string {
  return ["namykids", "outbox-index", record.parentUserId, record.childId].join(":");
}

const prohibitedKey = /token|authorization|email|phone|nickname|payment|idfa|aaid|fingerprint/i;

export function assertPrivacySafePersistence(value: unknown, path = "root"): void {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (prohibitedKey.test(key)) {
      throw new Error(`Prohibited local persistence field: ${path}.${key}`);
    }
    assertPrivacySafePersistence(nested, `${path}.${key}`);
  }
}

export class JsonSessionSnapshotRepository implements SessionSnapshotRepository {
  constructor(private readonly store: KeyValueStore) {}

  async load(key: string): Promise<SessionSnapshot | null> {
    const value = await this.store.getItem(key);
    return value ? (JSON.parse(value) as SessionSnapshot) : null;
  }

  async save(snapshot: SessionSnapshot): Promise<void> {
    assertPrivacySafePersistence(snapshot);
    await this.store.setItem(sessionSnapshotKey(snapshot), JSON.stringify(snapshot));
  }

  async clear(key: string): Promise<void> {
    await this.store.removeItem(key);
  }
}

/** A per-parent/child index keeps durable pending records discoverable after app restart. */
export class JsonPendingCompletionRepository implements PendingCompletionRepository {
  constructor(private readonly store: KeyValueStore) {}

  async enqueue(record: PendingCompletion): Promise<void> {
    assertPrivacySafePersistence(record);
    const key = pendingCompletionKey(record);
    const indexKey = pendingCompletionIndexKey(record);
    const existing = await this.readIndex(indexKey);
    await this.store.setItem(key, JSON.stringify(record));
    if (!existing.includes(record.completionId)) {
      await this.store.setItem(indexKey, JSON.stringify([...existing, record.completionId]));
    }
  }

  async list(parentUserId: Uuid, childId: Uuid): Promise<readonly PendingCompletion[]> {
    const identity = { parentUserId, childId };
    const completionIds = await this.readIndex(pendingCompletionIndexKey(identity));
    const records = await Promise.all(
      completionIds.map(async (completionId) => {
        const value = await this.store.getItem(pendingCompletionKey({ ...identity, completionId }));
        return value ? (JSON.parse(value) as PendingCompletion) : null;
      })
    );
    return records.filter((record): record is PendingCompletion => record !== null);
  }

  async remove(record: Pick<PendingCompletion, "parentUserId" | "childId" | "completionId">): Promise<void> {
    const indexKey = pendingCompletionIndexKey(record);
    const completionIds = await this.readIndex(indexKey);
    await this.store.removeItem(pendingCompletionKey(record));
    await this.store.setItem(indexKey, JSON.stringify(completionIds.filter((id) => id !== record.completionId)));
  }

  private async readIndex(key: string): Promise<readonly Uuid[]> {
    const value = await this.store.getItem(key);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  }
}
