import { COLOR_LEVELS, COLORS, type ColorId } from "../colors";
import { ITEMS, type ItemId } from "../items";
import { pick, pickOne, shuffle } from "../engine/random";
import type { Card, Cell, ChooseRound, FillRound, FlipCard, FlipRound, GameContent, Level, MatchRound, Pic, Rng } from "../engine/types";

/*
 * Games for the three groups that opened after the Language area: Màu sắc, Gia đình,
 * Nghệ thuật & sáng tạo. Every game is content run by an existing template (choose, match,
 * fill, sequence, flip); no new engine.
 */

const name = (id: ItemId) => ITEMS[id].name;
const cname = (c: ColorId) => COLORS[c].name;
/** "màu đỏ" -> "đỏ" */
const bareColor = (c: ColorId) => cname(c).replace(/^màu /, "");
const byLevel = <T,>(level: Level, values: readonly [T, T, T]): T => values[level];
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const itemCard = (id: ItemId, key: string = id): Card => ({ id: key, pic: { item: id }, say: name(id) });
const colorCard = (c: ColorId, key: string = c): Card => ({ id: key, pic: { color: c }, say: cname(c) });

function matchBoard(prompt: string, pairs: readonly (readonly [Card, Card])[], rng: Rng): MatchRound {
  return { kind: "match", prompt, top: pairs.map(([a]) => a), bottom: shuffle(pairs.map(([, b]) => b), rng), pairs: Object.fromEntries(pairs.map(([a, b]) => [a.id, b.id])) };
}

/* ======================= MÀU SẮC ======================= */

/** Pictures whose drawn colour is clearly the named colour (checked one by one against the image). */
const LOOKS: Partial<Record<ColorId, ItemId[]>> = {
  do: ["apple", "strawberry", "tomato", "cherries"],
  vang: ["banana", "chick", "lemon", "corn"],
  "xanh-la": ["leaf", "frog", "broccoli", "cucumber"],
  "xanh-duong": ["droplet", "whale", "cap", "bluebook"],
  cam: ["carrot", "tangerine", "orange"],
  tim: ["grapes", "eggplant", "umbrella"],
  hong: ["pig", "flamingo", "blossom"],
  nau: ["bear", "chestnut", "teddy"],
};

/**
 * Things whose real-life colour is that colour, for "what colour is it?" and painting.
 * Kept stricter than LOOKS: no oranges (Vietnamese oranges are often green), no grapes (green or purple),
 * nothing man-made whose colour could be anything.
 */
const TRUE_COLOR: Partial<Record<ColorId, ItemId[]>> = {
  do: ["tomato", "strawberry"],
  vang: ["banana", "chick", "lemon"],
  "xanh-la": ["leaf", "frog", "broccoli"],
  "xanh-duong": ["droplet"],
  cam: ["carrot"],
  tim: ["eggplant"],
  hong: ["flamingo"],
  nau: ["chestnut", "bear"],
};

const levelColors = (level: Level) => COLOR_LEVELS[level] as readonly ColorId[];
const withLooks = (level: Level) => levelColors(level).filter((c) => LOOKS[c]?.length);
const withTrue = (level: Level) => levelColors(level).filter((c) => TRUE_COLOR[c]?.length);

/* ---------- M1. Chạm đúng màu (listen and choose, 2–4) ---------- */

const chamDungMau: GameContent = {
  rounds: (level, rng) => {
    const choices = byLevel(level, [2, 3, 4] as const);
    const pool = levelColors(level);
    return pick(pool, 3, rng).map((target): ChooseRound => {
      const others = pick(pool.filter((c) => c !== target), choices - 1, rng);
      return {
        kind: "choose",
        prompt: `${cap(cname(target))} đâu nhỉ? Con chạm vào ${cname(target)} nhé.`,
        short: cap(cname(target)),
        cards: shuffle([target, ...others], rng).map((c) => colorCard(c)),
        answers: [target],
        praise: `Đúng rồi! Đây là ${cname(target)}.`,
      };
    });
  },
};

/* ---------- M2. Tìm đồ cùng màu (tap all of one colour, 3–5) ---------- */

const timDoCungMau: GameContent = {
  rounds: (level, rng) => {
    const [right, total] = byLevel(level, [[2, 4], [2, 5], [3, 6]] as const);
    const pool = withLooks(level);
    return pick(pool, 3, rng).map((color): ChooseRound => {
      const yes = pick(LOOKS[color] ?? [], right, rng);
      const no = pick(pool.filter((c) => c !== color).flatMap((c) => LOOKS[c] ?? []), total - yes.length, rng);
      return {
        kind: "choose",
        prompt: `Con chạm vào tất cả những thứ ${cname(color)} nhé.`,
        short: `Tìm đồ ${cname(color)}`,
        cards: shuffle([...yes, ...no], rng).map((id) => itemCard(id)),
        answers: yes,
        scene: { color },
        praise: `Giỏi quá! Con tìm đủ những thứ ${cname(color)} rồi.`,
      };
    });
  },
};

/* ---------- M3. Quả này màu gì? (match a thing to its colour, 3–5) ---------- */

const mauGiDay: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map(() => matchBoard(
      "Con chạm một tranh ở trên, rồi chạm vào màu của nó ở dưới nhé.",
      pick(withTrue(level), n, rng).map((c) => {
        const id = pickOne(TRUE_COLOR[c] ?? [], rng);
        return [itemCard(id), colorCard(c)] as const;
      }),
      rng,
    ));
  },
};

/* ---------- M4. Pha màu (paint mixing, drag-fill, 5–6) ---------- */

/** Paint mixing as taught in preschool art (pigments, not light). */
const MIXES: readonly (readonly [ColorId, ColorId, ColorId])[] = [
  ["do", "vang", "cam"],
  ["vang", "xanh-duong", "xanh-la"],
  ["do", "xanh-duong", "tim"],
  ["do", "trang", "hong"],
];

const phaMau: GameContent = {
  rounds: (level, rng) => {
    const mixes = level === 0 ? MIXES.slice(0, 3) : MIXES;
    const trayN = byLevel(level, [2, 3, 3] as const);
    return pick(mixes, 3, rng).map(([a, b, result]): FillRound => {
      const wrong = pick((["cam", "xanh-la", "tim", "hong", "nau"] as ColorId[]).filter((c) => c !== result), trayN - 1, rng);
      const cells: Cell[] = [
        { fixed: { color: a }, say: cname(a) },
        { fixed: { sign: "+" } },
        { fixed: { color: b }, say: cname(b) },
        { fixed: { sign: "=" } },
        { gap: result, label: "?" },
      ];
      return {
        kind: "fill",
        prompt: `${cap(cname(a))} trộn với ${cname(b)} thì ra màu gì? Con kéo màu vào ô trống nhé.`,
        short: `${cap(bareColor(a))} + ${bareColor(b)} = ?`,
        cells,
        tray: shuffle([result, ...wrong], rng).map((c) => colorCard(c)),
        praise: `Đúng rồi! ${cap(bareColor(a))} trộn với ${bareColor(b)} ra ${cname(result)}.`,
      };
    });
  },
};

/* ======================= GIA ĐÌNH ======================= */

/** Family members, named from the child's point of view. */
const FAMILY_EASY: ItemId[] = ["dad", "mom", "grandpa", "grandma", "baby"];
const FAMILY_ALL: ItemId[] = [...FAMILY_EASY, "brother", "sister"];
const familyPool = (level: Level) => (level === 0 ? FAMILY_EASY : FAMILY_ALL);
/** The interim pictures of "anh trai" and "bố" are too alike to be told apart side by side. */
const lookAlike = (a: ItemId, b: ItemId) => (a === "brother" && b === "dad") || (a === "dad" && b === "brother");

/* ---------- F1. Ai đây nhỉ? (listen and choose, 2–4) ---------- */

const aiDayNhi: GameContent = {
  rounds: (level, rng) => {
    const choices = byLevel(level, [2, 3, 4] as const);
    const pool = familyPool(level);
    return pick(pool, 3, rng).map((target): ChooseRound => ({
      kind: "choose",
      prompt: `${cap(name(target))} đâu nhỉ? Con chạm vào ${name(target)} nhé.`,
      short: `${cap(name(target))} đâu?`,
      cards: shuffle([target, ...pick(pool.filter((p) => p !== target && !lookAlike(p, target)), choices - 1, rng)], rng).map((id) => itemCard(id)),
      answers: [target],
      praise: `Đúng rồi! Đây là ${name(target)}.`,
    }));
  },
};

/* ---------- F2. Từ bé đến lớn (sequence by age, 4–5) ---------- */

type Step = { item: ItemId; say: string };
const S = {
  baby: { item: "baby", say: "Em bé" }, sister: { item: "sister", say: "Chị gái" }, brother: { item: "brother", say: "Anh trai" },
  mom: { item: "mom", say: "Mẹ" }, dad: { item: "dad", say: "Bố" }, grandma: { item: "grandma", say: "Bà" }, grandpa: { item: "grandpa", say: "Ông" },
} satisfies Record<string, Step>;
/**
 * Age lines. The interim pictures of "anh trai" and "bố" look alike, so they never appear in the same line;
 * the 3-step lines skip one middle generation and keep only very different ages.
 */
const LINES: readonly (readonly Step[])[] = [
  [S.baby, S.sister, S.mom, S.grandma],
  [S.baby, S.brother, S.mom, S.grandpa],
  [S.baby, S.sister, S.dad, S.grandpa],
];
const short = (line: readonly Step[]) => [line[0], line[1], line[3]] as Step[];

function sequenceRound(prompt: string, steps: readonly Step[], prePlaced: number, rng: Rng, praise: string): FillRound {
  const cells: Cell[] = steps.map((s, i) => (i < prePlaced ? { fixed: { item: s.item } as Pic, say: s.say } : { gap: `s${i}`, label: String(i + 1) }));
  const tray = shuffle(steps.slice(prePlaced).map((s, j) => ({ id: `s${j + prePlaced}`, pic: { item: s.item } as Pic, say: s.say })), rng);
  return { kind: "fill", prompt, cells, tray, inOrder: true, praise };
}

const tuBeDenLon: GameContent = {
  rounds: (level, rng) => {
    const prompt = "Ai nhỏ tuổi nhất? Con xếp từ người nhỏ nhất đến người lớn tuổi nhất nhé.";
    const pre = byLevel(level, [1, 1, 0] as const);
    return pick(LINES, 2, rng).map((line, i) => {
      const steps = level === 0 ? short(line) : line;
      return sequenceRound(prompt, steps, pre, rng, `${i ? "Giỏi quá!" : "Đúng rồi!"} ${steps.map((s) => s.say.toLowerCase()).join(", ")}.`);
    });
  },
};

/* ---------- F3. Lật thẻ cả nhà (flip cards, 3–6) ---------- */

const latTheCaNha: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    return [0, 1].map((): FlipRound => ({
      kind: "flip",
      prompt: "Con lật hai thẻ. Nếu là cùng một người thì thẻ được giữ lại nhé.",
      cards: shuffle(pick(familyPool(level).filter((p) => p !== "brother"), n, rng).flatMap((id): FlipCard[] => [{ ...itemCard(id, `${id}-1`), pair: id }, { ...itemCard(id, `${id}-2`), pair: id }]), rng),
      praise: "Giỏi quá! Con tìm đủ cả nhà rồi.",
    }));
  },
};

/* ======================= NGHỆ THUẬT & SÁNG TẠO ======================= */

/* ---------- A1. Tô màu cho tranh (match paint to an uncoloured picture, 3–5) ---------- */

/** Pictures whose outline alone is easy to recognise, with their real colour. */
const PAINT: readonly (readonly [ItemId, ColorId])[] = [
  ["tomato", "do"], ["strawberry", "do"], ["banana", "vang"], ["chick", "vang"], ["leaf", "xanh-la"],
  ["droplet", "xanh-duong"], ["carrot", "cam"], ["eggplant", "tim"], ["flamingo", "hong"], ["chestnut", "nau"],
];

const toMauChoTranh: GameContent = {
  rounds: (level, rng) => {
    const n = byLevel(level, [2, 3, 4] as const);
    const allowed = new Set(levelColors(level));
    return [0, 1].map(() => {
      const chosen: (readonly [ItemId, ColorId])[] = [];
      for (const pair of shuffle(PAINT.filter(([, c]) => allowed.has(c)), rng)) {
        if (chosen.length < n && !chosen.some(([, c]) => c === pair[1])) chosen.push(pair);
      }
      return matchBoard(
        "Con chạm vào một màu, rồi chạm vào tranh cần tô màu đó nhé.",
        chosen.map(([id, c]) => [colorCard(c, `paint-${c}`), { id, pic: { item: id, blank: true }, say: name(id), done: { item: id } }] as const),
        rng,
      );
    });
  },
};

/* ---------- A2. Nhạc cụ tên gì? (listen and choose, 3–5; names only, no instrument sounds yet) ---------- */

const INSTRUMENTS_EASY: ItemId[] = ["drum", "guitar", "piano", "trumpet"];
const INSTRUMENTS_ALL: ItemId[] = [...INSTRUMENTS_EASY, "flute", "maracas", "violin"];

const nhacCu: GameContent = {
  rounds: (level, rng) => {
    const choices = byLevel(level, [2, 3, 4] as const);
    const pool = level === 0 ? INSTRUMENTS_EASY : INSTRUMENTS_ALL;
    return pick(pool, 3, rng).map((target): ChooseRound => ({
      kind: "choose",
      prompt: `${cap(name(target))} đâu nhỉ? Con chạm vào ${name(target)} nhé.`,
      short: `${cap(name(target))} đâu?`,
      cards: shuffle([target, ...pick(pool.filter((p) => p !== target), choices - 1, rng)], rng).map((id) => itemCard(id)),
      answers: [target],
      praise: `Đúng rồi! Đây là ${name(target)}.`,
    }));
  },
};

/* ---------- A3. Xâu vòng hạt màu (colour pattern, drag-fill, 4–6) ---------- */

/** Pattern units: "AB" repeats A, B; "ABC" repeats A, B, C; "AAB" repeats A, A, B. */
const UNITS: readonly (readonly string[])[] = [["A", "B"], ["A", "B", "C"], ["A", "A", "B"]];

const xauVong: GameContent = {
  rounds: (level, rng) => {
    const units = level === 0 ? [UNITS[0]] : level === 1 ? [UNITS[0], UNITS[2]] : [UNITS[1], UNITS[2]];
    return [0, 1, 2].map((): FillRound => {
      const unit = pickOne(units, rng) as readonly string[];
      const letters = [...new Set(unit)];
      const cols = pick(levelColors(Math.min(level, 1) as Level), letters.length, rng);
      const colorOf = (l: string) => cols[letters.indexOf(l)] as ColorId;
      const length = unit.length * 2 + (unit.length === 2 ? 1 : 0);
      const beads = Array.from({ length }, (_, i) => colorOf(unit[i % unit.length] as string));
      // One gap at the end; on Khó with an ABC unit, the last two beads are gaps (always two different colours).
      const gaps = level === 2 && unit.length === 3 && new Set(beads.slice(-2)).size === 2 ? 2 : 1;
      const cells: Cell[] = beads.map((c, i) => (i >= length - gaps ? { gap: c, label: "?" } : { fixed: { color: c }, say: cname(c) }));
      const answers = beads.slice(length - gaps);
      const extra = pick(levelColors(1).filter((c) => !answers.includes(c)), 3 - answers.length, rng);
      return {
        kind: "fill",
        prompt: gaps === 2 ? "Con xâu tiếp hai hạt cho đúng quy luật nhé." : "Hạt tiếp theo màu gì? Con xâu tiếp cho đúng quy luật nhé.",
        cells,
        strung: true,
        tray: shuffle([...answers, ...extra], rng).map((c) => colorCard(c)),
        praise: `Đẹp quá! ${beads.map((c) => bareColor(c)).join(", ")}.`,
      };
    });
  },
};

export const GROUP_CONTENT: Record<string, GameContent> = {
  "cham-dung-mau": chamDungMau,
  "tim-do-cung-mau": timDoCungMau,
  "mau-gi-day": mauGiDay,
  "pha-mau": phaMau,
  "ai-day-nhi": aiDayNhi,
  "tu-be-den-lon": tuBeDenLon,
  "lat-the-ca-nha": latTheCaNha,
  "to-mau-cho-tranh": toMauChoTranh,
  "nhac-cu": nhacCu,
  "xau-vong": xauVong,
};
