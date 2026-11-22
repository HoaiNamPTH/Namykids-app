import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANGUAGE_GAMES, TEMPLATES } from "../src/play/catalog";
import { isPlayRoute } from "../src/play/play-routes";
import { chooseFemaleVietnamese } from "../src/play/voice-pick";

const itemFiles = new Set(readdirSync("src/assets/play/items", { withFileTypes: true }).map((f) => f.name).filter((n) => n.endsWith(".png")).map((n) => n.slice(0, -4)));

describe("language area catalogue", () => {
  it("has the 26 games sent to the Product Owner, numbered 1 to 26 with unique ids", () => {
    expect(LANGUAGE_GAMES).toHaveLength(26);
    expect(LANGUAGE_GAMES.map((g) => g.no)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
    expect(new Set(LANGUAGE_GAMES.map((g) => g.id)).size).toBe(26);
  });

  it("puts 15 games covering the five core play types in milestone 2", () => {
    const m2 = LANGUAGE_GAMES.filter((g) => g.milestone === 2);
    expect(m2).toHaveLength(15);
    expect(new Set(m2.map((g) => g.template))).toEqual(new Set(["listen-choose", "tap-select", "match-pairs", "drag-fill", "sequence"]));
  });

  it("gives every game a spoken intro, a known template and an existing picture", () => {
    for (const game of LANGUAGE_GAMES) {
      expect(game.intro.length).toBeGreaterThan(10);
      expect(TEMPLATES[game.template]).toBeDefined();
      if ("item" in game.icon) expect(itemFiles.has(game.icon.item)).toBe(true);
    }
  });
});

describe("voice choice", () => {
  const v = (name: string, language = "vi-VN") => ({ identifier: name, name, language });

  it("picks a female Vietnamese voice when one exists", () => {
    expect(chooseFemaleVietnamese([v("Microsoft An - Vietnamese (Vietnam)"), v("Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)")])?.name).toContain("HoaiMy");
    expect(chooseFemaleVietnamese([v("Linh")])?.name).toBe("Linh");
    expect(chooseFemaleVietnamese([v("Google Tiếng Việt")])?.name).toBe("Google Tiếng Việt");
  });

  it("never falls back to a male or non-Vietnamese voice", () => {
    expect(chooseFemaleVietnamese([v("Microsoft An - Vietnamese (Vietnam)")])).toBeNull();
    expect(chooseFemaleVietnamese([v("Google US English", "en-US")])).toBeNull();
  });
});

describe("play routes", () => {
  it("run without the backend runtime only for kid play paths", () => {
    expect(isPlayRoute("home")).toBe(true);
    expect(isPlayRoute("area/[areaId]")).toBe(true);
    expect(isPlayRoute("game/[gameId]")).toBe(true);
    expect(isPlayRoute("(app)/child-world")).toBe(false);
    expect(isPlayRoute("(app)/parent")).toBe(false);
  });
});
