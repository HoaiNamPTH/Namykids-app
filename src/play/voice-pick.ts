const FEMALE = /hoaimy|hoài my|hoai my|linh|google|female|nữ|\bmy\b|\blan\b|\bmai\b/i;
const MALE = /\ban\b|nam ?minh|\bmale\b|\bnam\b/i;

type VoiceLike = { identifier: string; name: string; language: string };

/** Choose a female Vietnamese voice. Never falls back to a male voice (for example "Microsoft An"). */
export function chooseFemaleVietnamese<T extends VoiceLike>(voices: readonly T[]): T | null {
  const vietnamese = voices.filter((v) => /^vi/i.test(v.language) || /vietnam|tiếng việt/i.test(v.name));
  return vietnamese.find((v) => FEMALE.test(v.name) && !MALE.test(v.name)) ?? null;
}
