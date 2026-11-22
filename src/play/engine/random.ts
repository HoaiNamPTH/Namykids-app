import type { Rng } from "./types";

export function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export function pick<T>(list: readonly T[], n: number, rng: Rng): T[] {
  return shuffle(list, rng).slice(0, n);
}

export function pickOne<T>(list: readonly T[], rng: Rng): T {
  const item = list[Math.floor(rng() * list.length)];
  if (item === undefined) throw new Error("pickOne from empty list");
  return item;
}

/** Small seeded generator so tests are repeatable. */
export function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
