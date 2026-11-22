/** Vietnamese alphabet (29 letters) and how the guide reads each letter. */
export const ALPHABET = ["A", "Ă", "Â", "B", "C", "D", "Đ", "E", "Ê", "G", "H", "I", "K", "L", "M", "N", "O", "Ô", "Ơ", "P", "Q", "R", "S", "T", "U", "Ư", "V", "X", "Y"] as const;

const NAMES: Record<string, string> = {
  a: "a", ă: "á", â: "ớ", b: "bờ", c: "cờ", d: "dờ", đ: "đờ", e: "e", ê: "ê", g: "gờ", h: "hờ", i: "i", k: "ca",
  l: "lờ", m: "mờ", n: "nờ", o: "o", ô: "ô", ơ: "ơ", p: "pờ", q: "quờ", r: "rờ", s: "sờ", t: "tờ", u: "u", ư: "ư",
  v: "vờ", x: "xờ", y: "i dài",
};

export function letterName(letter: string): string {
  return NAMES[letter.toLowerCase()] ?? letter;
}

/** Groups of letters that look alike; used to make the choices meaningful. */
export const LOOK_ALIKE = [["o", "ô", "ơ"], ["a", "ă", "â"], ["e", "ê"], ["u", "ư"], ["b", "d", "đ"], ["m", "n"], ["p", "q"], ["i", "l"]] as const;
