import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import type { Level } from "./engine/types";

/** Local play record, kept on the device. A later milestone syncs it for the parent area. */
export type PlayLog = { gameId: string; level: Level; at: number };
export type Progress = { best: Record<string, number>; log: PlayLog[] };

const KEY = "namykids.play.progress.v1";
let state: Progress = { best: {}, log: [] };
let loaded = false;
const listeners = new Set<(p: Progress) => void>();

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) state = { best: {}, log: [], ...JSON.parse(raw) as Partial<Progress> };
  } catch {
    // Storage can be unavailable (private browsing); play still works for this session.
  }
  listeners.forEach((fn) => fn(state));
}

/** Pure update, exported for tests. `best` holds the number of levels completed (1..3). */
export function withCompletion(p: Progress, gameId: string, level: Level, at: number): Progress {
  return {
    best: { ...p.best, [gameId]: Math.max(p.best[gameId] ?? 0, level + 1) },
    log: [{ gameId, level, at }, ...p.log].slice(0, 200),
  };
}

export function recordCompletion(gameId: string, level: Level): void {
  state = withCompletion(state, gameId, level, Date.now());
  listeners.forEach((fn) => fn(state));
  void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => undefined);
}

export function useProgress(): Progress {
  const [p, setP] = useState(state);
  useEffect(() => {
    listeners.add(setP);
    void load();
    return () => { listeners.delete(setP); };
  }, []);
  return p;
}
