/**
 * Nam 27/11/2026: the guide must never say the same thing twice in a row.
 * Helpers that decide which lines to say when two would be (almost) the same.
 */
function words(text: string): string[] {
  return text.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
}

/** True when two lines say (almost) the same thing: one contains the other, or most words are shared. */
export function nearSame(a: string, b: string): boolean {
  const wa = words(a);
  const wb = words(b);
  if (!wa.length || !wb.length) return false;
  const ja = wa.join(" ");
  const jb = wb.join(" ");
  if (ja.includes(jb) || jb.includes(ja)) return true;
  const sa = new Set(wa);
  const sb = new Set(wb);
  let shared = 0;
  sa.forEach((w) => { if (sb.has(w)) shared += 1; });
  return shared / Math.min(sa.size, sb.size) >= 0.75;
}

/** When a game opens: the intro, then the first round's prompt, unless the prompt repeats the intro (then only the prompt). */
export function openingLines(intro: string, firstPrompt: string): string[] {
  return nearSame(intro, firstPrompt) ? [firstPrompt] : [intro, firstPrompt];
}

/** Said after a correct match. Two identical cards are named once ("Đúng rồi, quả bóng!"). */
export function matchLine(topSay: string, bottomSay: string, done: boolean): string {
  const base = topSay === bottomSay ? `Đúng rồi, ${topSay}!` : `Đúng rồi! ${topSay} và ${bottomSay}.`;
  return done ? `${base} Con ghép xong rồi!` : base;
}
