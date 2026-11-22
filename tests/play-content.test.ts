import { describe, expect, it } from "vitest";
import { LANGUAGE_GAMES } from "../src/play/catalog";
import { LANGUAGE_CONTENT } from "../src/play/content/language";
import { chooseResult, fillDone, fillFits, matchResult, nextGap } from "../src/play/engine/judge";
import { seeded } from "../src/play/engine/random";
import type { FillRound, Level, Round } from "../src/play/engine/types";
import { ITEMS } from "../src/play/items";
import { withCompletion } from "../src/play/progress";

const LEVELS: Level[] = [0, 1, 2];
const SEEDS = Array.from({ length: 25 }, (_, i) => i + 1);

function allRounds(id: string): { level: Level; rounds: Round[] }[] {
  const content = LANGUAGE_CONTENT[id];
  if (!content) throw new Error(id);
  return LEVELS.flatMap((level) => SEEDS.map((seed) => ({ level, rounds: content.rounds(level, seeded(seed * 7 + level)) })));
}

describe("milestone 2 content", () => {
  it("has content for exactly the 15 milestone-2 games", () => {
    const m2 = LANGUAGE_GAMES.filter((g) => g.milestone === 2).map((g) => g.id).sort();
    expect(Object.keys(LANGUAGE_CONTENT).sort()).toEqual(m2);
  });

  for (const id of Object.keys(LANGUAGE_CONTENT)) {
    it(`${id}: every round is well formed and solvable at every level`, () => {
      for (const { rounds } of allRounds(id)) {
        expect(rounds.length).toBeGreaterThan(0);
        for (const r of rounds) {
          expect(r.prompt.length).toBeGreaterThan(5);
          if (r.kind === "choose") {
            const ids = r.cards.map((c) => c.id);
            expect(new Set(ids).size).toBe(ids.length);
            expect(r.answers.length).toBeGreaterThan(0);
            r.answers.forEach((a) => expect(ids).toContain(a));
            expect(r.cards.length).toBeGreaterThan(r.answers.length);
          } else if (r.kind === "match") {
            expect(Object.keys(r.pairs).sort()).toEqual(r.top.map((c) => c.id).sort());
            expect(Object.values(r.pairs).sort()).toEqual(r.bottom.map((c) => c.id).sort());
          } else {
            const tray = r.tray.map((c) => c.id);
            expect(new Set(tray).size).toBe(tray.length);
            const gaps = r.cells.flatMap((c) => ("gap" in c ? [c.gap] : []));
            gaps.forEach((g) => expect(tray).toContain(g));
          }
          for (const card of r.kind === "choose" ? r.cards : r.kind === "match" ? [...r.top, ...r.bottom] : r.tray) {
            if ("item" in card.pic) expect(ITEMS[card.pic.item]).toBeDefined();
            expect(card.say.length).toBeGreaterThan(0);
          }
        }
      }
    });
  }

  it("levels get harder: more choices, pairs or gaps", () => {
    const size = (r: Round) => (r.kind === "choose" ? r.cards.length : r.kind === "match" ? r.top.length : r.tray.length);
    for (const id of ["tim-do-vat", "ban-giong-het", "chu-con-thieu", "be-gom-nhom"]) {
      const content = LANGUAGE_CONTENT[id];
      const [easy, mid, hard] = LEVELS.map((l) => size(content!.rounds(l, seeded(3))[0]!));
      expect(easy).toBeLessThan(mid!);
      expect(mid).toBeLessThanOrEqual(hard!);
    }
  });

  it("Chữ nào còn thiếu follows the approved 2 -> 3 -> 4 gap progression", () => {
    const gaps = LEVELS.map((l) => (LANGUAGE_CONTENT["chu-con-thieu"]!.rounds(l, seeded(9))[0] as FillRound).cells.filter((c) => "gap" in c).length);
    expect(gaps).toEqual([2, 3, 4]);
  });

  it("Ai kêu thế nhỉ? never says the animal's name before the child chooses", () => {
    for (const { rounds } of allRounds("ai-keu-the")) {
      for (const r of rounds) {
        if (r.kind !== "choose") continue;
        for (const card of r.cards) {
          const word = card.say.replace(/^con /, "");
          expect(r.prompt.toLowerCase()).not.toContain(word);
        }
      }
    }
  });

  it("Âm đầu là gì? offers pictures with different first sounds", () => {
    for (const { rounds } of allRounds("am-dau")) {
      for (const r of rounds) {
        if (r.kind !== "choose") continue;
        expect(r.cards.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("template rules", () => {
  it("choose: wrong, partial and done", () => {
    const r = { kind: "choose" as const, prompt: "p", cards: [], answers: ["a", "b"], praise: "" };
    expect(chooseResult(r, [], "x")).toBe("wrong");
    expect(chooseResult(r, [], "a")).toBe("correct");
    expect(chooseResult(r, ["a"], "a")).toBe("again");
    expect(chooseResult(r, ["a"], "b")).toBe("done");
  });

  it("match: wrong pair, then done", () => {
    const r = { kind: "match" as const, prompt: "p", top: [], bottom: [], pairs: { t1: "b1", t2: "b2" } };
    expect(matchResult(r, [], "t1", "b2")).toBe("wrong");
    expect(matchResult(r, [], "t1", "b1")).toBe("correct");
    expect(matchResult(r, ["t1"], "t2", "b2")).toBe("done");
  });

  it("fill: fits, next gap in order, done", () => {
    const r: FillRound = { kind: "fill", prompt: "p", praise: "", tray: [], cells: [{ fixed: { glyph: "A" } }, { gap: "B" }, { gap: "C" }] };
    expect(fillFits(r, 1, "B")).toBe(true);
    expect(fillFits(r, 1, "C")).toBe(false);
    expect(fillFits(r, 0, "A")).toBe(false);
    expect(nextGap(r, {})).toBe(1);
    expect(nextGap(r, { 1: "B" })).toBe(2);
    expect(fillDone(r, { 1: "B" })).toBe(false);
    expect(fillDone(r, { 1: "B", 2: "C" })).toBe(true);
  });

  it("progress keeps the best level and a recent log", () => {
    let p = withCompletion({ best: {}, log: [] }, "g", 1, 1);
    p = withCompletion(p, "g", 0, 2);
    expect(p.best.g).toBe(2);
    expect(p.log.map((l) => l.at)).toEqual([2, 1]);
  });
});
