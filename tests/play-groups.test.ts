import { describe, expect, it } from "vitest";
import { ALL_GAMES, GROUP_GAMES, gamesForArea } from "../src/play/catalog";
import { COLOR_LEVELS, COLORS } from "../src/play/colors";
import { GROUP_CONTENT } from "../src/play/content/groups";
import { chooseResult, fillDone, fillFits, flipResult, matchResult } from "../src/play/engine/judge";
import { seeded } from "../src/play/engine/random";
import type { Card, Level, Pic, Round } from "../src/play/engine/types";
import { ITEMS } from "../src/play/items";

const LEVELS: Level[] = [0, 1, 2];
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const rounds = (id: string) => LEVELS.flatMap((level) => SEEDS.map((seed) => ({ level, rounds: GROUP_CONTENT[id]!.rounds(level, seeded(seed * 11 + level)) })));
const pics = (r: Round): Pic[] => r.kind === "choose" ? r.cards.map((c) => c.pic) : r.kind === "match" ? [...r.top, ...r.bottom].map((c) => c.pic)
  : r.kind === "flip" ? r.cards.map((c) => c.pic) : [...r.tray.map((c) => c.pic), ...r.cells.flatMap((c) => ("fixed" in c ? [c.fixed] : []))];

describe("Màu sắc, Gia đình, Nghệ thuật games", () => {
  it("open the three groups that showed 'Sắp có'", () => {
    expect(gamesForArea("mau-sac")).toHaveLength(4);
    expect(gamesForArea("gia-dinh")).toHaveLength(3);
    expect(gamesForArea("nghe-thuat")).toHaveLength(3);
    expect(Object.keys(GROUP_CONTENT).sort()).toEqual(GROUP_GAMES.map((g) => g.id).sort());
    expect(new Set(ALL_GAMES.map((g) => g.id)).size).toBe(ALL_GAMES.length);
  });

  it("every game has a short on-screen line and a spoken intro", () => {
    for (const g of ALL_GAMES) {
      expect(g.short.length).toBeGreaterThan(2);
      expect(g.short.split(" ").length).toBeLessThanOrEqual(6);
      expect(g.intro.length).toBeGreaterThan(g.short.length);
    }
  });

  it("never says plain 'xanh' for a colour", () => {
    for (const c of Object.values(COLORS)) if (c.name.includes("xanh")) expect(c.name).toMatch(/xanh (lá|dương)/);
  });

  for (const id of Object.keys(GROUP_CONTENT)) {
    it(`${id}: every round is well formed and solvable at every level`, () => {
      for (const { level, rounds: rs } of rounds(id)) {
        expect(rs.length).toBeGreaterThan(0);
        for (const r of rs) {
          expect(r.prompt.length).toBeGreaterThan(5);
          for (const p of pics(r)) {
            if ("item" in p) expect(ITEMS[p.item]).toBeDefined();
            if ("color" in p) expect(COLORS[p.color]).toBeDefined();
          }
          if (r.kind === "choose") {
            const ids = r.cards.map((c) => c.id);
            expect(new Set(ids).size).toBe(ids.length);
            r.answers.forEach((a) => expect(ids).toContain(a));
            expect(r.cards.length).toBeGreaterThan(r.answers.length);
            let found: string[] = [];
            for (const a of r.answers) { const res = chooseResult(r, found, a); expect(res === "wrong").toBe(false); found = [...found, a]; }
            if (id === "cham-dung-mau") r.cards.forEach((c) => expect(COLOR_LEVELS[level]).toContain((c.pic as { color: string }).color));
          }
          if (r.kind === "match") {
            const tops = Object.keys(r.pairs);
            expect(tops.length).toBe(r.top.length);
            const results = tops.map((t, i) => matchResult(r, tops.slice(0, i), t, r.pairs[t]!));
            expect(results.at(-1)).toBe("done");
          }
          if (r.kind === "fill") {
            const filled: Record<number, string> = {};
            r.cells.forEach((c, i) => { if ("gap" in c) { const card = r.tray.find((t) => t.id === c.gap) as Card; expect(card).toBeDefined(); expect(fillFits(r, i, card.id)).toBe(true); filled[i] = card.id; } });
            expect(fillDone(r, filled)).toBe(true);
            expect(new Set(r.tray.map((t) => t.id)).size).toBe(r.tray.length);
          }
          if (r.kind === "flip") {
            const byPair = new Map<string, string[]>();
            r.cards.forEach((c) => byPair.set(c.pair, [...(byPair.get(c.pair) ?? []), c.id]));
            for (const [, ids] of byPair) { expect(ids).toHaveLength(2); expect(flipResult(r, [], ids[0]!, ids[1]!)).not.toBe("wrong"); }
          }
        }
      }
    });
  }

  it("Pha màu only uses the four preschool paint mixes", () => {
    const ok = new Set(["do+vang=cam", "vang+xanh-duong=xanh-la", "do+xanh-duong=tim", "do+trang=hong"]);
    for (const { rounds: rs } of rounds("pha-mau")) for (const r of rs) {
      if (r.kind !== "fill") continue;
      const [a, , b, , gap] = r.cells;
      const key = `${(a as { fixed: { color: string } }).fixed.color}+${(b as { fixed: { color: string } }).fixed.color}=${(gap as { gap: string }).gap}`;
      expect(ok.has(key)).toBe(true);
    }
  });

  it("Ai đây nhỉ? shows each family member at most once per round", () => {
    for (const { rounds: rs } of rounds("ai-day-nhi")) for (const r of rs) if (r.kind === "choose") {
      const ids = r.cards.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("Xâu vòng: the beads before the gap really follow the pattern", () => {
    for (const { rounds: rs } of rounds("xau-vong")) for (const r of rs) if (r.kind === "fill") {
      const seq = r.cells.map((c) => ("fixed" in c ? (c.fixed as { color: string }).color : c.gap));
      const unit = [2, 3].find((u) => seq.every((c, i) => i < u || c === seq[i - u]));
      expect(unit).toBeDefined();
    }
  });
});
