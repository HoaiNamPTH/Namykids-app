import { expect, it } from "vitest";
import { ALL_GAMES } from "../src/play/catalog";
import { LANGUAGE_CONTENT } from "../src/play/content/language";
import { GROUP_CONTENT } from "../src/play/content/groups";
import { seeded } from "../src/play/engine/random";
import { AREAS } from "../src/play/areas";
import { STICKERS } from "../src/play/stickers";
import { LEVEL_NAMES } from "../src/play/engine/types";
import { RECORDED_LINES } from "../src/play/recorded-lines";

// Nam 27/11/2026: every line the app can say must have a Vita recording (the web preview has no device voice).
it("has a recording for every line the app can say", () => {
  const out = new Map<string, string>();
  const add = (t: string | undefined, src: string) => { if (t && t.trim() && !out.has(t.trim())) out.set(t.trim(), src); };
  const all = { ...LANGUAGE_CONTENT, ...GROUP_CONTENT };
  for (const g of ALL_GAMES) {
    add(g.intro, "intro"); add(g.title, "title");
    add(`${g.intro} Trò này sắp có nhé!`, "soon");
    add(`Trò ${g.title} cần bố mẹ mở thêm nhé. Con chơi các trò khác trước nha.`, "locked");
    add(`Con chơi xong mức Khó trò ${g.title} để nhận sticker này nhé.`, "album");
    const c = all[g.id]; if (!c) continue;
    for (const level of [0, 1, 2] as const) for (let s = 1; s <= 150; s++) {
      for (const r of c.rounds(level, seeded(s * 13 + level))) {
        add(r.prompt, "prompt:" + g.id);
        if (r.kind !== "match") add(r.praise, "praise:" + g.id);
        if (r.kind === "choose") for (const cd of r.cards) { add(cd.say, "say"); add(`Đúng rồi, ${cd.say}!`, "right:" + g.id); }
        if (r.kind === "flip") for (const cd of r.cards) add(cd.say, "say");
        if (r.kind === "fill") { for (const cd of r.tray) add(cd.say, "say"); for (const cl of r.cells) if ("fixed" in cl) add(cl.say, "say"); }
        if (r.kind === "match") {
          for (const cd of [...r.top, ...r.bottom]) add(cd.say, "say");
          for (const [a, b] of Object.entries(r.pairs)) {
            const top = r.top.find((x) => x.id === a), bot = r.bottom.find((x) => x.id === b);
            add(`Đúng rồi! ${top?.say} và ${bot?.say}.`, "match:" + g.id);
            add(`Đúng rồi! ${top?.say} và ${bot?.say}. Con ghép xong rồi!`, "match:" + g.id);
          }
        }
      }
    }
  }
  for (const a of AREAS) { add(`${a.name} sắp có nhé!`, "area"); add(`${a.name}! Con chọn một trò để chơi nhé.`, "area"); }
  for (const s of STICKERS) add(s.praise, "sticker");
  for (const n of LEVEL_NAMES) add(`Mình chơi mức ${n} nhé!`, "level");
  for (let i = 1; i <= 30; i++) add(`Con có ${i} sticker rồi. Giỏi quá!`, "album");
  ["Chào con! Hôm nay mình khám phá gì nhỉ?", "Con chơi xong mức Khó của một trò để nhận sticker nhé!", "Chưa đúng rồi. Con thử lại nhé.",
   "Đúng cặp rồi!", "Chưa đúng đôi rồi. Con thử lại nhé.", "Chưa đúng chỗ rồi. Con thử lại nhé.", "Giọng hướng dẫn đã bật.",
   "Giỏi quá! Con làm xong rồi!", "Tuyệt vời! Nami và Niko rất vui!", "Con giỏi lắm! Mình chơi tiếp nhé!", "Hoan hô con! Con làm rất tốt!",
   "Con chăm chỉ quá! Nami thương con lắm!", "Con nghe giỏi ghê! Niko vỗ tay nè!", "Xuất sắc! Con cố gắng lắm đó!", "Ôi, con làm được rồi! Cừ quá!"].forEach((t) => add(t, "fixed"));
  const missing = [...out].filter(([t]) => RECORDED_LINES[t] === undefined);
  expect(missing.map(([t, src]) => `${src}: ${t}`)).toEqual([]);
});
