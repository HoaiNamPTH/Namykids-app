import { describe, expect, it } from "vitest";
import { ALL_GAMES } from "../src/play/catalog";
import { GROUP_CONTENT } from "../src/play/content/groups";
import { LANGUAGE_CONTENT } from "../src/play/content/language";
import { seeded } from "../src/play/engine/random";
import type { Level, Round } from "../src/play/engine/types";

// Nam 28/11/2026: every round shows its question as text, so a parent who joins mid-game
// (or plays on a muted phone) sees what the child is asked without listening.
// Nam 28/11/2026 (later): the text stays short; Vita still reads the full sentence.
const CONTENT = { ...LANGUAGE_CONTENT, ...GROUP_CONTENT };
const LEVELS: Level[] = [0, 1, 2];
const HIDES_ANSWER = new Set(["nghe-chon-chu"]);
const shownText = (round: Round, fallback: string) => round.short ?? fallback;

describe("on-screen question text", () => {
  for (const game of ALL_GAMES) {
    it(`${game.id}: the screen changes whenever the spoken question changes`, () => {
      const content = CONTENT[game.id];
      expect(content).toBeDefined();
      for (const level of LEVELS) for (let seed = 1; seed <= 20; seed += 1) {
        const rounds = content!.rounds(level, seeded(seed * 13 + level));
        const byPrompt = new Map<string, string>();
        for (const r of rounds) {
          const text = shownText(r, game.short);
          expect(text.length).toBeGreaterThan(2);
          expect(text.length).toBeLessThanOrEqual(30);
          expect(text).not.toMatch(/vần [a-zđ](?!\p{L})/iu);
          byPrompt.set(r.prompt, text);
        }
        // Two different spoken questions never share the same on-screen line,
        // except where the line would give the answer away (the child must listen).
        if (!HIDES_ANSWER.has(game.id)) expect(new Set(byPrompt.values()).size).toBe(byPrompt.size);
      }
    });
  }

  it("Nghe rồi chọn chữ never prints the letter to find", () => {
    for (const r of LANGUAGE_CONTENT["nghe-chon-chu"]!.rounds(2, seeded(5))) expect(r.short).toBeUndefined();
  });

  it("Âm đầu shows the sound of the round, e.g. 'Âm đầu: b (bờ)'", () => {
    const rounds = LANGUAGE_CONTENT["am-dau"]!.rounds(1, seeded(3));
    for (const r of rounds) expect(r.short).toMatch(/^Âm đầu: [a-zđ] \(\p{L}+\)$/u);
  });
});
