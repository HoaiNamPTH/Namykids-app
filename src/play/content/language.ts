import type { ItemId } from "../items";
import { ITEMS } from "../items";
import { pick, pickOne, shuffle } from "../engine/random";
import type { Card, ChooseRound, FillRound, FlipCard, FlipRound, GameContent, Level, MatchRound, Pic, Rng, Where } from "../engine/types";
import { ALPHABET, letterName, LOOK_ALIKE } from "./letters";

/* ---------- helpers ---------- */

const name = (id: ItemId) => ITEMS[id].name;
const itemCard = (id: ItemId, key: string = id): Card => ({ id: key, pic: { item: id }, say: name(id) });
const glyphCard = (glyph: string, key: string, say: string): Card => ({ id: key, pic: { glyph }, say });
const byLevel = <T,>(level: Level, values: readonly [T, T, T]): T => values[level];
/** "con mèo" -> "mèo", "quả táo" -> "táo" */
const bare = (id: ItemId) => name(id).replace(/^(con|quả|cái|chiếc|đôi|bông|chùm|ngôi|quyển|cây) /, "");

function chooseRounds(count: number, make: (i: number) => ChooseRound): ChooseRound[] {
  return Array.from({ length: count }, (_, i) => make(i));
}

/** Listen-and-choose round over a pool of items, never asking for the same target twice. */
function listenRounds(pool: readonly ItemId[], level: Level, rng: Rng, prompt: (id: ItemId) => string, praise: (id: ItemId) => string, distinct?: (a: ItemId, b: ItemId) => boolean): ChooseRound[] {
  const choices = byLevel(level, [2, 3, 4] as const);
  const targets = pick(pool, 3, rng);
  return targets.map((target) => {
    const others = shuffle(pool.filter((p) => p !== target && (!distinct || distinct(p, target))), rng).slice(0, choices - 1);
    return { kind: "choose", prompt: prompt(target), cards: shuffle([target, ...others], rng).map((id) => itemCard(id)), answers: [target], praise: praise(target) };
  });
}

function matchBoard(prompt: string, pairs: readonly (readonly [Card, Card])[], rng: Rng): MatchRound {
  const top = pairs.map(([a]) => a);
  const bottom = shuffle(pairs.map(([, b]) => b), rng);
  return { kind: "match", prompt, top, bottom, pairs: Object.fromEntries(pairs.map(([a, b]) => [a.id, b.id])) };
}

/* ---------- 1. Bé tìm đồ vật ---------- */

const EVERYDAY: ItemId[] = ["apple", "banana", "ball", "car", "cap", "shoe", "teddy", "cup", "umbrella", "book", "bicycle", "balloon", "spoon", "chair"];

const timDoVat: GameContent = {
  rounds: (level, rng) => listenRounds(EVERYDAY, level, rng, (id) => `${cap(name(id))} đâu nhỉ? Con chạm vào ${name(id)} nhé.`, (id) => `Đúng rồi! Đây là ${name(id)}.`)
    .map((r) => ({ ...r, short: `${cap(name(r.answers[0] as ItemId))} đâu?` })),
};

/* ---------- 2. Ai kêu thế nhỉ? (never names the animal before the child chooses) ---------- */

const SOUNDS: Partial<Record<ItemId, string>> = {
  cat: "meo meo", dog: "gâu gâu", cow: "ùm ùm", rooster: "ò ó o", duck: "cạp cạp", pig: "ụt ịt", chick: "chíp chíp", frog: "ộp ộp", bee: "vo ve",
};
const SOUND_ANIMALS = Object.keys(SOUNDS) as ItemId[];

const aiKeuThe: GameContent = {
  rounds: (level, rng) => listenRounds(SOUND_ANIMALS, level, rng, (id) => `Ai kêu thế nhỉ? ${cap(SOUNDS[id] ?? "")}, ${SOUNDS[id]}!`, (id) => `Đúng rồi! ${cap(name(id))} kêu ${SOUNDS[id]}.`)
    .map((r) => ({ ...r, short: `${cap(SOUNDS[r.answers[0] as ItemId] ?? "")}?` })),
};

/* ---------- 3. Tìm bạn giống hệt ---------- */

const SAME_POOL: ItemId[] = ["teddy", "ball", "apple", "car", "duck", "star", "balloon", "kite", "cat", "fish", "banana", "drum"];

const banGiongHet: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => matchBoard("Con chạm một tranh ở trên, rồi chạm tranh giống hệt ở dưới nhé.", pick(SAME_POOL, n, rng).map((id) => [itemCard(id, `${id}-a`), itemCard(id, `${id}-b`)] as const), rng));
  },
};

/* ---------- 4. Mẹ ơi, con đâu? (baby drawn smaller) ---------- */

const MOMS: ItemId[] = ["cat", "dog", "duck", "cow", "pig", "elephant", "horse", "rabbit", "monkey"];

const meOiConDau: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => matchBoard("Con chạm bạn mẹ ở trên, rồi tìm em bé của bạn ấy ở dưới nhé.", pick(MOMS, n, rng).map((id) => [
      { id: `${id}-me`, pic: { item: id }, say: `${bare(id)} mẹ` },
      { id: `${id}-con`, pic: { item: id, small: true }, say: `${bare(id)} con` },
    ] as const), rng));
  },
};

/* ---------- 5. Đôi bạn thân ---------- */

const FRIENDS: [ItemId, ItemId][] = [["lock", "key"], ["shoe", "socks"], ["bowl", "spoon"], ["book", "pencil"], ["cloud", "umbrella"], ["cup", "milk"]];

const doiBanThan: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => matchBoard("Con ghép hai đồ vật hay đi cùng nhau nhé.", pick(FRIENDS, n, rng).map(([a, b]) => [itemCard(a), itemCard(b)] as const), rng));
  },
};

/* ---------- 6. Bé gom nhóm / 7. Cái nào khác nhóm? ---------- */

const GROUPS: { label: string; plural: string; items: ItemId[] }[] = [
  { label: "quả", plural: "các loại quả", items: ["apple", "banana", "orange", "grapes", "strawberry", "watermelon"] },
  { label: "con vật", plural: "các con vật", items: ["cat", "dog", "cow", "pig", "duck", "rabbit", "elephant"] },
  { label: "xe", plural: "các loại xe", items: ["car", "bus", "truck", "bicycle", "airplane", "boat"] },
  { label: "đồ chơi", plural: "các đồ chơi", items: ["ball", "teddy", "kite", "balloon", "drum"] },
];

const beGomNhom: GameContent = {
  rounds: (level, rng) => {
    const [right, total] = byLevel(level, [[2, 4], [3, 5], [3, 6]] as const);
    return chooseRounds(3, () => {
      const group = pickOne(GROUPS, rng);
      const yes = pick(group.items, right, rng);
      const no = pick(GROUPS.filter((g) => g !== group).flatMap((g) => g.items), total - right, rng);
      return { kind: "choose", prompt: `Con chạm vào tất cả ${group.plural} nhé.`, short: `Tìm ${group.plural}`, cards: shuffle([...yes, ...no], rng).map((id) => itemCard(id)), answers: yes, praise: `Giỏi quá! Con tìm đủ ${group.plural} rồi.` };
    });
  },
};

const khacNhom: GameContent = {
  rounds: (level, rng) => {
    const same = byLevel(level, [2, 3, 4] as const);
    return chooseRounds(3, () => {
      const [group, other] = pick(GROUPS, 2, rng) as [typeof GROUPS[number], typeof GROUPS[number]];
      const odd = pickOne(other.items, rng);
      const cards = shuffle([...pick(group.items, same, rng), odd], rng).map((id) => itemCard(id));
      return { kind: "choose", prompt: "Có một bạn không cùng nhóm. Con tìm bạn ấy nhé.", cards, answers: [odd], praise: `Đúng rồi! ${cap(name(odd))} không cùng nhóm ${group.label}.` };
    });
  },
};

/* ---------- 12. Chuyện cây con / 13. Một ngày của bé (sequence) ---------- */

type Step = { item: ItemId; say: string };

function sequenceRound(prompt: string, steps: readonly Step[], prePlaced: number, rng: Rng, praise: string): FillRound {
  const cells = steps.map((s, i) => (i < prePlaced ? { fixed: { item: s.item } as Pic, say: s.say } : { gap: `s${i}`, label: String(i + 1) }));
  const tray = shuffle(steps.slice(prePlaced).map((s, j) => ({ id: `s${j + prePlaced}`, pic: { item: s.item } as Pic, say: s.say })), rng);
  return { kind: "fill", prompt, cells, tray, inOrder: true, praise };
}

const PLANT: Step[] = [
  { item: "seedling", say: "Cây mầm nhú lên" },
  { item: "potted", say: "Cây lớn dần" },
  { item: "tree", say: "Cây thành cây to" },
  { item: "apple", say: "Cây ra quả" },
];
const FLOWER: Step[] = [
  { item: "seedling", say: "Cây mầm nhú lên" },
  { item: "potted", say: "Cây lớn dần" },
  { item: "sunflower", say: "Cây nở hoa" },
];

const chuyenCayCon: GameContent = {
  rounds: (level, rng) => {
    const prompt = "Con xếp tranh theo thứ tự cây lớn lên nhé. Cái gì đến trước?";
    if (level === 0) return [sequenceRound(prompt, FLOWER, 1, rng, "Đúng rồi! Cây mầm lớn lên rồi nở hoa."), sequenceRound(prompt, PLANT.slice(0, 3), 1, rng, "Giỏi quá! Cây mầm lớn thành cây to.")];
    if (level === 1) return [sequenceRound(prompt, FLOWER, 0, rng, "Đúng rồi! Cây mầm lớn lên rồi nở hoa."), sequenceRound(prompt, PLANT.slice(0, 3), 0, rng, "Giỏi quá! Cây mầm lớn thành cây to.")];
    return [sequenceRound(prompt, FLOWER, 0, rng, "Đúng rồi! Cây mầm lớn lên rồi nở hoa."), sequenceRound(prompt, PLANT, 0, rng, "Tuyệt vời! Cây lớn lên rồi ra quả.")];
  },
};

const MORNING: Step[] = [
  { item: "alarm", say: "Bé thức dậy" },
  { item: "toothbrush", say: "Bé đánh răng" },
  { item: "bread", say: "Bé ăn sáng" },
  { item: "school", say: "Bé đi học" },
];
const EVENING: Step[] = [
  { item: "bowl", say: "Bé ăn tối" },
  { item: "droplet", say: "Bé đi tắm" },
  { item: "book", say: "Bé nghe kể chuyện" },
  { item: "bed", say: "Bé đi ngủ" },
];

const motNgayCuaBe: GameContent = {
  rounds: (level, rng) => {
    const prompt = "Bé làm việc gì trước, việc gì sau? Con xếp theo thứ tự nhé.";
    const steps = byLevel(level, [3, 3, 4] as const);
    const pre = byLevel(level, [1, 0, 0] as const);
    return [
      sequenceRound(prompt, MORNING.slice(0, steps), pre, rng, "Đúng rồi! Buổi sáng bé thức dậy, đánh răng rồi ăn sáng."),
      sequenceRound(prompt, EVENING.slice(0, steps), pre, rng, "Giỏi quá! Buổi tối bé ăn tối, đi tắm rồi nghe kể chuyện."),
    ];
  },
};

/* ---------- 15. Âm đầu là gì? ---------- */

/** Word (without classifier) and its first sound. Pictures in one round always have different first sounds. */
const FIRST_SOUND: Partial<Record<ItemId, { word: string; letter: string }>> = {
  ball: { word: "bóng", letter: "b" }, cow: { word: "bò", letter: "b" },
  fish: { word: "cá", letter: "c" }, crab: { word: "cua", letter: "c" },
  cat: { word: "mèo", letter: "m" }, cap: { word: "mũ", letter: "m" },
  rooster: { word: "gà", letter: "g" }, chair: { word: "ghế", letter: "g" },
  leaf: { word: "lá", letter: "l" }, speaker: { word: "loa", letter: "l" },
  flower: { word: "hoa", letter: "h" }, tiger: { word: "hổ", letter: "h" },
  elephant: { word: "voi", letter: "v" }, duck: { word: "vịt", letter: "v" },
  apple: { word: "táo", letter: "t" }, turtle: { word: "rùa", letter: "r" },
};
const SOUND_ITEMS = Object.keys(FIRST_SOUND) as ItemId[];
const firstLetter = (id: ItemId) => FIRST_SOUND[id]?.letter ?? "";

const amDau: GameContent = {
  rounds: (level, rng) => listenRounds(SOUND_ITEMS, level, rng,
    (id) => `Cái gì bắt đầu bằng âm ${letterName(firstLetter(id))}? ${cap(letterName(firstLetter(id)))}, ${letterName(firstLetter(id))}.`,
    (id) => `Đúng rồi! ${cap(FIRST_SOUND[id]?.word ?? "")} bắt đầu bằng âm ${letterName(firstLetter(id))}.`,
    (a, b) => firstLetter(a) !== firstLetter(b))
    .map((r) => ({ ...r, short: `Bắt đầu bằng "${firstLetter(r.answers[0] as ItemId)}"?` })),
};

/* ---------- 19. Nghe rồi chọn chữ ---------- */

const ngheChonChu: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    const groups = shuffle(LOOK_ALIKE.filter((g) => g.length >= Math.min(n, 3)), rng);
    return chooseRounds(3, (i) => {
      const group = groups[i % groups.length] ?? LOOK_ALIKE[0];
      const base: string[] = pick(group, Math.min(n, group.length), rng);
      const extra = pick(ALPHABET.map((l) => l.toLowerCase()).filter((l) => !base.includes(l)), n - base.length, rng);
      const letters = shuffle([...base, ...extra], rng);
      const target = pickOne(base, rng);
      return { kind: "choose", prompt: `Con chạm vào chữ ${letterName(target)}.`, short: `Chữ ${letterName(target)}`, cards: letters.map((l) => glyphCard(l, l, `chữ ${letterName(l)}`)), answers: [target], praise: `Đúng rồi! Đây là chữ ${letterName(target)}.` };
    });
  },
};

/* ---------- 20. Chữ cái và tranh ---------- */

const LETTER_PICS: [string, ItemId][] = [["b", "ball"], ["c", "fish"], ["m", "cat"], ["g", "rooster"], ["l", "leaf"], ["h", "flower"], ["v", "elephant"], ["t", "apple"]];

const chuVaTranh: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => matchBoard("Con chạm một chữ, rồi chạm tranh bắt đầu bằng chữ đó nhé.", pick(LETTER_PICS, n, rng).map(([l, id]) => [
      glyphCard(l, `l-${l}`, `chữ ${letterName(l)}`),
      { id: `p-${l}`, pic: { item: id }, say: FIRST_SOUND[id]?.word ?? name(id) },
    ] as const), rng));
  },
};

/* ---------- 21. Chữ hoa, chữ thường ---------- */

const chuHoaThuong: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => matchBoard("Con chạm chữ hoa ở trên, rồi tìm chữ thường của nó ở dưới nhé.", pick(ALPHABET, n, rng).map((L) => [
      glyphCard(L, `U-${L}`, `chữ ${letterName(L)} hoa`),
      glyphCard(L.toLowerCase(), `l-${L}`, `chữ ${letterName(L)} thường`),
    ] as const), rng));
  },
};

/* ---------- 22. Chữ nào còn thiếu? (E02 Missing Letters, 2 -> 3 -> 4 gaps) ---------- */

const chuConThieu: GameContent = {
  rounds: (level, rng) => {
    const [len, gaps, distract] = byLevel(level, [[5, 2, 0], [6, 3, 0], [7, 4, 1]] as const);
    return [0, 1].map((): FillRound => {
      const start = Math.floor(rng() * (ALPHABET.length - len));
      const run = ALPHABET.slice(start, start + len);
      const holes = new Set(pick(run.map((_, i) => i).slice(1), gaps, rng));
      const cells = run.map((L, i) => (holes.has(i) ? { gap: L } : { fixed: { glyph: L } as Pic, say: `chữ ${letterName(L)}` }));
      const extra = pick(ALPHABET.filter((L) => !run.includes(L)), distract, rng);
      const tray = shuffle([...run.filter((_, i) => holes.has(i)), ...extra].map((L) => glyphCard(L, L, `chữ ${letterName(L)}`)), rng);
      return { kind: "fill", prompt: "Chữ nào còn thiếu? Con kéo chữ vào ô trống nhé.", cells, tray, praise: `Giỏi quá! ${run.map((L) => letterName(L)).join(", ")}.` };
    });
  },
};

/* ---------- 23. Chữ đầu của tranh ---------- */

const WORDS: { item: ItemId; first: string; rest: string; word: string }[] = [
  { item: "fish", first: "c", rest: "á", word: "cá" },
  { item: "cow", first: "b", rest: "ò", word: "bò" },
  { item: "cat", first: "m", rest: "èo", word: "mèo" },
  { item: "rooster", first: "g", rest: "à", word: "gà" },
  { item: "leaf", first: "l", rest: "á", word: "lá" },
  { item: "elephant", first: "v", rest: "oi", word: "voi" },
  { item: "flower", first: "h", rest: "oa", word: "hoa" },
  { item: "apple", first: "t", rest: "áo", word: "táo" },
];

const chuDauCuaTranh: GameContent = {
  rounds: (level, rng) => {
    const choices = byLevel(level, [2, 3, 4] as const);
    return pick(WORDS, 2, rng).map((w): FillRound => {
      const others = pick([...new Set(WORDS.map((x) => x.first))].filter((l) => l !== w.first), choices - 1, rng);
      return {
        kind: "fill",
        prompt: `Đây là ${name(w.item)}. ${cap(w.word)} bắt đầu bằng chữ gì? Con kéo chữ vào ô trống nhé.`,
        scene: { item: w.item },
        cells: [{ gap: w.first }, { fixed: { glyph: w.rest }, say: w.word }],
        tray: shuffle([w.first, ...others].map((l) => glyphCard(l, l, `chữ ${letterName(l)}`)), rng),
        praise: `Đúng rồi! ${cap(w.word)} bắt đầu bằng chữ ${letterName(w.first)}.`,
      };
    });
  },
};

/* ================= Milestone 3 ================= */

/* ---------- 8. Cái gì để làm gì? (names the use, never the object) ---------- */

const USES: Partial<Record<ItemId, string>> = {
  scissors: "để cắt giấy", spoon: "để xúc cơm", toothbrush: "để đánh răng", umbrella: "để che mưa",
  pencil: "để vẽ tranh", key: "để mở khóa", bed: "để nằm ngủ", soap: "để rửa tay",
  cup: "để uống nước", lamp: "để thắp sáng", clock: "để xem giờ", towel: "để lau tay",
};
const USE_ITEMS = Object.keys(USES) as ItemId[];

const deLamGi: GameContent = {
  rounds: (level, rng) => listenRounds(USE_ITEMS, level, rng, (id) => `Cái gì dùng ${USES[id]} nhỉ?`, (id) => `Đúng rồi! ${cap(name(id))} dùng ${USES[id]}.`)
    .map((r) => ({ ...r, short: `Cái gì ${USES[r.answers[0] as ItemId]}?` })),
};

/* ---------- 9. Bạn đang thấy thế nào? (Dễ/Vừa: the feeling; Khó: a little story) ---------- */

const FEELINGS: { item: ItemId; word: string; story: string }[] = [
  { item: "happy", word: "vui", story: "Bạn được mẹ tặng quà sinh nhật." },
  { item: "sad", word: "buồn", story: "Bạn làm rơi mất quả bóng bay." },
  { item: "angry", word: "tức giận", story: "Bạn bị lấy mất đồ chơi." },
  { item: "scared", word: "sợ hãi", story: "Trời tối và có tiếng sấm to." },
  { item: "surprised", word: "ngạc nhiên", story: "Bạn mở hộp ra và thấy một chú mèo con." },
];

const camXuc: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return pick(FEELINGS, 3, rng).map((f): ChooseRound => {
      const others = pick(FEELINGS.filter((x) => x !== f), n - 1, rng);
      const prompt = level < 2 ? `Bạn nào đang ${f.word}? Con chạm vào khuôn mặt ${f.word} nhé.` : `${f.story} Bạn thấy thế nào nhỉ?`;
      return { kind: "choose", prompt, short: level < 2 ? `Bạn nào ${f.word}?` : "Bạn thấy thế nào?", cards: shuffle([f, ...others], rng).map((x) => itemCard(x.item)), answers: [f.item], praise: `Đúng rồi! Bạn ấy đang ${f.word}.` };
    });
  },
};

/* ---------- 10. Trên, dưới, trong ---------- */

const WHERE_WORD: Record<Where, string> = { tren: "ở trên", duoi: "ở dưới", trong: "ở trong", canh: "ở bên cạnh" };
const PLACES: { thing: ItemId; on: ItemId; wheres: Where[] }[] = [
  { thing: "cat", on: "chair", wheres: ["tren", "duoi", "canh"] },
  { thing: "ball", on: "chair", wheres: ["tren", "duoi", "canh"] },
  { thing: "bird", on: "tree", wheres: ["tren", "duoi", "canh"] },
  { thing: "apple", on: "bowl", wheres: ["trong", "canh", "tren"] },
  { thing: "teddy", on: "house", wheres: ["trong", "canh", "tren"] },
];

const trenDuoiTrong: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 3] as const);
    const pool = level === 0 ? PLACES.filter((p) => p.wheres.includes("duoi")) : PLACES;
    return pick(pool, 3, rng).map((p): ChooseRound => {
      const wheres = level === 0 ? (["tren", "duoi"] as Where[]) : shuffle(p.wheres, rng).slice(0, n);
      const target = pickOne(wheres, rng);
      const label = (w: Where) => `${name(p.thing)} ${WHERE_WORD[w]} ${name(p.on)}`;
      return {
        kind: "choose",
        prompt: `Con chạm vào tranh ${label(target)} nhé.`,
        short: cap(label(target)),
        cards: shuffle(wheres, rng).map((w) => ({ id: w, pic: { item: p.thing, on: p.on, where: w }, say: label(w) })),
        answers: [target],
        praise: `Đúng rồi! ${cap(label(target))}.`,
      };
    });
  },
};

/* ---------- 11. Ngược nhau ---------- */

const OPPOSITES: [ItemId, string, ItemId, string][] = [
  ["fire", "nóng", "snowflake", "lạnh"],
  ["sun", "ban ngày", "moon", "ban đêm"],
  ["happy", "vui", "sad", "buồn"],
  ["elephant", "to", "mouse", "nhỏ"],
  ["rabbit", "nhanh", "snail", "chậm"],
  ["giraffe", "cao", "turtle", "thấp"],
];

const nguocNhau: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => matchBoard("Con chạm một tranh ở trên, rồi tìm tranh ngược với nó ở dưới nhé.", pick(OPPOSITES, n, rng).map(([a, sa, b, sb]) => [
      { id: `${a}-a`, pic: { item: a }, say: sa },
      { id: `${b}-b`, pic: { item: b }, say: sb },
    ] as const), rng));
  },
};

/* ---------- 14. Bé rửa tay ---------- */

const HANDS: Step[] = [
  { item: "droplet", say: "Làm ướt tay" },
  { item: "soap", say: "Xoa xà phòng" },
  { item: "towel", say: "Lau khô tay" },
];
const TEETH: Step[] = [
  { item: "cup", say: "Lấy cốc nước" },
  { item: "toothbrush", say: "Chải răng" },
  { item: "droplet", say: "Súc miệng" },
  { item: "towel", say: "Lau miệng" },
];

const beRuaTay: GameContent = {
  rounds: (level, rng) => {
    const pre = level === 0 ? 1 : 0;
    const teeth = level === 2 ? TEETH : TEETH.slice(1);
    return [
      sequenceRound("Rửa tay thế nào nhỉ? Con xếp các bước theo thứ tự nhé.", HANDS, pre, rng, "Giỏi quá! Làm ướt tay, xoa xà phòng, rồi lau khô."),
      sequenceRound("Đánh răng thế nào nhỉ? Con xếp các bước theo thứ tự nhé.", teeth, pre, rng, "Tuyệt vời! Răng con sạch bóng rồi."),
    ];
  },
};

/* ---------- 16. Cùng âm đầu ---------- */

const SAME_START: [ItemId, ItemId][] = [["ball", "cow"], ["fish", "crab"], ["cat", "cap"], ["rooster", "chair"], ["leaf", "speaker"], ["flower", "tiger"], ["elephant", "duck"]];
const word = (id: ItemId) => FIRST_SOUND[id]?.word ?? bare(id);

const cungAmDau: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => matchBoard("Con ghép hai tranh có tên bắt đầu bằng cùng một âm nhé.", pick(SAME_START, n, rng).map(([a, b]) => [
      { id: `${a}-a`, pic: { item: a }, say: word(a) },
      { id: `${b}-b`, pic: { item: b }, say: word(b) },
    ] as const), rng));
  },
};

/* ---------- 17. Vần với nhau (one pair per rhyme in a board) ---------- */

const RHYMES: { a: ItemId; wa: string; b: ItemId; wb: string; rhyme: string }[] = [
  { a: "fish", wa: "cá", b: "leaf", wb: "lá", rhyme: "a" },
  { a: "rooster", wa: "gà", b: "house", wb: "nhà", rhyme: "a" },
  { a: "cow", wa: "bò", b: "grapes", wb: "nho", rhyme: "o" },
  { a: "rabbit", wa: "thỏ", b: "dog", wb: "chó", rhyme: "o" },
  { a: "cloud", wa: "mây", b: "tree", wb: "cây", rhyme: "ây" },
  { a: "apple", wa: "táo", b: "star", wb: "sao", rhyme: "ao" },
  { a: "crab", wa: "cua", b: "turtle", wb: "rùa", rhyme: "ua" },
  { a: "cat", wa: "mèo", b: "scissors", wb: "kéo", rhyme: "eo" },
];

const vanVoiNhau: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => {
      const chosen: typeof RHYMES = [];
      for (const r of shuffle(RHYMES, rng)) if (chosen.length < n && !chosen.some((c) => c.rhyme === r.rhyme)) chosen.push(r);
      return matchBoard("Con ghép hai tranh có tên nghe vần với nhau nhé. Cá với lá, nghe giống nhau đó!", chosen.map((r) => [
        { id: `${r.a}-a`, pic: { item: r.a }, say: r.wa },
        { id: `${r.b}-b`, pic: { item: r.b }, say: r.wb },
      ] as const), rng);
    });
  },
};

/* ---------- 18. Vỗ tay đếm tiếng ---------- */

const CLAP: { item: ItemId; words: string }[] = [
  { item: "fish", words: "cá" }, { item: "elephant", words: "voi" }, { item: "flower", words: "hoa" }, { item: "cow", words: "bò" },
  { item: "airplane", words: "máy bay" }, { item: "car", words: "ô tô" }, { item: "bicycle", words: "xe đạp" }, { item: "teddy", words: "gấu bông" },
  { item: "giraffe", words: "hươu cao cổ" }, { item: "carrot", words: "củ cà rốt" }, { item: "sunflower", words: "hoa hướng dương" }, { item: "strawberry", words: "quả dâu tây" },
  { item: "alarm", words: "đồng hồ báo thức" }, { item: "toothbrush", words: "bàn chải đánh răng" },
];
const NUMBER_WORDS = ["một", "hai", "ba", "bốn"];
const syllables = (w: string) => w.split(" ").length;

const voTayDemTieng: GameContent = {
  rounds: (level, rng) => {
    const max = byLevel(level, [2, 3, 4] as const);
    return pick(CLAP.filter((c) => syllables(c.words) <= max), 3, rng).map((c): ChooseRound => {
      const count = syllables(c.words);
      const slow = c.words.split(" ").join("... ");
      return {
        kind: "choose",
        prompt: `Con nghe nhé: ${c.words}. ${cap(slow)}. Có mấy tiếng?`,
        short: `${cap(c.words)}: mấy tiếng?`,
        scene: { item: c.item },
        cards: Array.from({ length: max }, (_, i) => glyphCard(String(i + 1), `n${i + 1}`, `${NUMBER_WORDS[i]} tiếng`)),
        answers: [`n${count}`],
        praise: `Đúng rồi! ${cap(c.words)} có ${NUMBER_WORDS[count - 1]} tiếng.`,
      };
    });
  },
};

/* ---------- 24. Xếp bảng chữ cái ---------- */

const xepBangChu: GameContent = {
  rounds: (level, rng) => {
    const [len, pre] = byLevel(level, [[3, 1], [4, 1], [5, 0]] as const);
    return [0, 1].map((): FillRound => {
      const start = Math.floor(rng() * (ALPHABET.length - len));
      const run = ALPHABET.slice(start, start + len);
      const cells = run.map((L, i) => (i < pre ? { fixed: { glyph: L } as Pic, say: `chữ ${letterName(L)}` } : { gap: L, label: "" }));
      const tray = shuffle(run.slice(pre).map((L) => glyphCard(L, L, `chữ ${letterName(L)}`)), rng);
      return { kind: "fill", prompt: "Con xếp các chữ theo đúng thứ tự bảng chữ cái nhé.", cells, tray, inOrder: true, praise: `Giỏi quá! ${run.map((L) => letterName(L)).join(", ")}.` };
    });
  },
};

/* ---------- 25. Lật thẻ tìm cặp / 26. Lật thẻ chữ và tranh ---------- */

const FLIP_POOL: ItemId[] = ["apple", "ball", "cat", "duck", "star", "car", "fish", "teddy", "balloon", "sun", "rabbit", "kite"];

const latTheTimCap: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map((): FlipRound => ({
      kind: "flip",
      prompt: "Con lật hai thẻ. Nếu hai tranh giống nhau thì thẻ được giữ lại nhé.",
      cards: shuffle(pick(FLIP_POOL, n, rng).flatMap((id): FlipCard[] => [{ ...itemCard(id, `${id}-1`), pair: id }, { ...itemCard(id, `${id}-2`), pair: id }]), rng),
      praise: "Giỏi quá! Con tìm được hết các cặp rồi.",
    }));
  },
};

const latTheChuTranh: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map((): FlipRound => ({
      kind: "flip",
      prompt: "Con lật tìm một chữ và một tranh bắt đầu bằng chữ đó nhé.",
      cards: shuffle(pick(LETTER_PICS, n, rng).flatMap(([l, id]): FlipCard[] => [
        { ...glyphCard(l, `l-${l}`, `chữ ${letterName(l)}`), pair: l },
        { id: `p-${l}`, pic: { item: id }, say: FIRST_SOUND[id]?.word ?? name(id), pair: l },
      ]), rng),
      praise: "Tuyệt vời! Con ghép đúng hết chữ và tranh rồi.",
    }));
  },
};

/* ---------- registry ---------- */

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const LANGUAGE_CONTENT: Record<string, GameContent> = {
  "tim-do-vat": timDoVat,
  "ai-keu-the": aiKeuThe,
  "ban-giong-het": banGiongHet,
  "me-oi-con-dau": meOiConDau,
  "doi-ban-than": doiBanThan,
  "be-gom-nhom": beGomNhom,
  "khac-nhom": khacNhom,
  "chuyen-cay-con": chuyenCayCon,
  "mot-ngay-cua-be": motNgayCuaBe,
  "am-dau": amDau,
  "nghe-chon-chu": ngheChonChu,
  "chu-va-tranh": chuVaTranh,
  "chu-hoa-thuong": chuHoaThuong,
  "chu-con-thieu": chuConThieu,
  "chu-dau-cua-tranh": chuDauCuaTranh,
  "de-lam-gi": deLamGi,
  "cam-xuc": camXuc,
  "tren-duoi-trong": trenDuoiTrong,
  "nguoc-nhau": nguocNhau,
  "be-rua-tay": beRuaTay,
  "cung-am-dau": cungAmDau,
  "van-voi-nhau": vanVoiNhau,
  "vo-tay-dem-tieng": voTayDemTieng,
  "xep-bang-chu": xepBangChu,
  "lat-the-tim-cap": latTheTimCap,
  "lat-the-chu-tranh": latTheChuTranh,
};
