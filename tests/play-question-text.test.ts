import { describe, expect, it } from "vitest";
import { ALL_GAMES } from "../src/play/catalog";
import { GROUP_CONTENT } from "../src/play/content/groups";
import { LANGUAGE_CONTENT } from "../src/play/content/language";
import { seeded } from "../src/play/engine/random";
import type { Level, Round } from "../src/play/engine/types";

// Nam 28/11/2026: every round shows its question as text, so a parent who joins mid-game
// (or plays on a muted phone) sees what the child is asked without listening.
const CONTENT = { ...LANGUAGE_CONTENT, ...GROUP_CONTENT };
const LEVELS: Level[] = [0, 1, 2];
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
          expect(text.length).toBeLessThanOrEqual(60);
          expect(text).not.toMatch(/vần [a-zđ](?!\p{L})/iu);
          byPrompt.set(r.prompt, text);
        }
        // Two different spoken questions never share the same on-screen line.
        expect(new Set(byPrompt.values()).size).toBe(byPrompt.size);
      }
    });
  }

  it("Âm đầu shows the sound of the round, e.g. 'âm b (bờ)'", () => {
    const rounds = LANGUAGE_CONTENT["am-dau"]!.rounds(1, seeded(3));
    for (const r of rounds) expect(r.short).toMatch(/^Cái gì bắt đầu bằng âm [a-zđ] \(\p{L}+\)\?$/u);
  });
});
