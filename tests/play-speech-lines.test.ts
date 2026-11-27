import { describe, expect, it } from "vitest";
import { ALL_GAMES } from "../src/play/catalog";
import { GROUP_CONTENT } from "../src/play/content/groups";
import { LANGUAGE_CONTENT } from "../src/play/content/language";
import { seeded } from "../src/play/engine/random";
import { matchLine, nearSame, openingLines } from "../src/play/speech-lines";

// Nam 27/11/2026: "some lines are said twice, or two almost identical lines in a row".
describe("speech lines", () => {
  it("spots repeated lines", () => {
    expect(nearSame("Con ghép hai đồ vật hay đi cùng nhau nhé.", "Con ghép hai đồ vật hay đi cùng nhau nhé.")).toBe(true);
    expect(nearSame("Con xếp tranh theo thứ tự cây lớn lên nhé.", "Con xếp tranh theo thứ tự cây lớn lên nhé. Cái gì đến trước?")).toBe(true);
    expect(nearSame("Con nghe tên đồ vật, rồi chạm vào tranh đúng nhé.", "Cái ghế đâu nhỉ? Con chạm vào cái ghế nhé.")).toBe(false);
  });

  it("never opens a game with two near-identical lines", () => {
    const all = { ...LANGUAGE_CONTENT, ...GROUP_CONTENT };
    for (const g of ALL_GAMES) {
      const c = all[g.id];
      if (!c) continue;
      for (const level of [0, 1, 2] as const) for (let s = 1; s <= 20; s++) {
        const first = c.rounds(level, seeded(s))[0];
        if (!first) continue;
        const lines = openingLines(g.intro, first.prompt);
        expect(lines.at(-1)).toBe(first.prompt);
        if (lines.length === 2) expect(nearSame(lines[0] ?? "", lines[1] ?? ""), `${g.id}: ${lines.join(" | ")}`).toBe(false);
      }
    }
  });

  it("names two identical cards once after a match", () => {
    expect(matchLine("quả bóng", "quả bóng", false)).toBe("Đúng rồi, quả bóng!");
    expect(matchLine("thỏ mẹ", "thỏ con", true)).toBe("Đúng rồi! thỏ mẹ và thỏ con. Con ghép xong rồi!");
  });
});
