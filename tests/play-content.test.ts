import { describe, expect, it } from "vitest";
import { LANGUAGE_GAMES } from "../src/play/catalog";
import { LANGUAGE_CONTENT } from "../src/play/content/language";
import { chooseResult, fillDone, fillFits, flipResult, matchResult, nextGap } from "../src/play/engine/judge";
import { seeded } from "../src/play/engine/random";
import type { FillRound, FlipRound, Level, Round } from "../src/play/engine/types";
import { ITEMS } from "../src/play/items";
import { withCompletion } from "../src/play/progress";

const LEVELS: Level[] = [0, 1, 2];
const SEEDS = Array.from({ length: 25 }, (_, i) => i + 1);

function allRounds(id: string): { level: Level; rounds: Round[] }[] {
  const content = LANGUAGE_CONTENT[id];
  if (!content) throw new Error(id);
  return LEVELS.flatMap((level) => SEEDS.map((seed) => ({ level, rounds: content.rounds(level, seeded(seed * 7 + level)) })));
}

describe("Language content", () => {
  it("has playable content for all 26 Language games", () => {
    expect(Object.keys(LANGUAGE_CONTENT).sort()).toEqual(LANGUAGE_GAMES.map((g) => g.id).sort());
  });

  it("each game's rounds use the board its template promises", () => {
    const kind = { "listen-choose": "choose", "tap-select": "choose", "match-pairs": "match", "drag-fill": "fill", sequence: "fill", "flip-cards": "flip" } as const;
    for (const g of LANGUAGE_GAMES) for (const { rounds } of allRounds(g.id)) rounds.forEach((r) => expect(r.kind).toBe(kind[g.template]));
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
          } else if (r.kind === "flip") {
            const ids = r.cards.map((c) => c.id);
            expect(new Set(ids).size).toBe(ids.length);
            const counts = new Map<string, number>();
            r.cards.forEach((c) => counts.set(c.pair, (counts.get(c.pair) ?? 0) + 1));
            [...counts.values()].forEach((v) => expect(v).toBe(2));
          } else {
            const tray = r.tray.map((c) => c.id);
            expect(new Set(tray).size).toBe(tray.length);
            const gaps = r.cells.flatMap((c) => ("gap" in c ? [c.gap] : []));
            gaps.forEach((g) => expect(tray).toContain(g));
          }
          for (const card of r.kind === "choose" || r.kind === "flip" ? r.cards : r.kind === "match" ? [...r.top, ...r.bottom] : r.tray) {
            if ("item" in card.pic) expect(ITEMS[card.pic.item]).toBeDefined();
            if ("on" in card.pic) expect(ITEMS[card.pic.on]).toBeDefined();
            expect(card.say.length).toBeGreaterThan(0);
          }
        }
      }
    });
  }

  it("levels get harder: more choices, pairs or gaps", () => {
    const size = (r: Round) => (r.kind === "choose" || r.kind === "flip" ? r.cards.length : r.kind === "match" ? r.top.length : r.tray.length);
    for (const id of ["tim-do-vat", "ban-giong-het", "chu-con-thieu", "be-gom-nhom", "lat-the-tim-cap", "nguoc-nhau", "vo-tay-dem-tieng", "xep-bang-chu"]) {
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

  it("Cái gì để làm gì? asks by the use, never by the object's name", () => {
    for (const { rounds } of allRounds("de-lam-gi")) for (const r of rounds) if (r.kind === "choose") r.cards.forEach((c) => expect(r.prompt).not.toContain(c.say));
  });

  it("Vỗ tay đếm tiếng: the right number matches the syllables", () => {
    for (const { rounds } of allRounds("vo-tay-dem-tieng")) for (const r of rounds) {
      if (r.kind !== "choose") continue;
      const said = r.prompt.split(":")[1]!.split(".")[0]!.trim();
      expect(r.answers).toEqual([`n${said.split(" ").length}`]);
    }
  });

  it("flip cards: only a real pair is kept", () => {
    const r = LANGUAGE_CONTENT["lat-the-chu-tranh"]!.rounds(1, seeded(4))[0] as FlipRound;
    const [a, b] = [r.cards[0]!, r.cards.find((c) => c !== r.cards[0] && c.pair === r.cards[0]!.pair)!];
    const other = r.cards.find((c) => c.pair !== a.pair)!;
    expect(flipResult(r, [], a.id, other.id)).toBe("wrong");
    expect(flipResult(r, [], a.id, a.id)).toBe("wrong");
    expect(flipResult(r, [], a.id, b.id)).toBe("correct");
    expect(flipResult(r, r.cards.filter((c) => c.pair !== a.pair).map((c) => c.id), a.id, b.id)).toBe("done");
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
