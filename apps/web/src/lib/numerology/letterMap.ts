// Pythagorean map
export const LETTER_MAP: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  I: 9,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  O: 6,
  P: 7,
  Q: 8,
  R: 9,
  S: 1,
  T: 2,
  U: 3,
  V: 4,
  W: 5,
  X: 6,
  Y: 7,
  Z: 8,
};

// Treat Y as a vowel
export const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);

// Basic diacritic folding
const FOLD: Record<string, string> = {
  Á: "A",
  À: "A",
  Â: "A",
  Ä: "A",
  Ã: "A",
  Å: "A",
  Ā: "A",
  É: "E",
  È: "E",
  Ê: "E",
  Ë: "E",
  Ē: "E",
  Í: "I",
  Ì: "I",
  Î: "I",
  Ï: "I",
  Ī: "I",
  Ó: "O",
  Ò: "O",
  Ô: "O",
  Ö: "O",
  Õ: "O",
  Ō: "O",
  Ú: "U",
  Ù: "U",
  Û: "U",
  Ü: "U",
  Ū: "U",
  Ç: "C",
  Ñ: "N",
};

export function normalizeName(input: string): string {
  if (!input) return "";
  return input
    .toUpperCase()
    .split("")
    .map((ch) => (LETTER_MAP[ch] ? ch : (FOLD[ch] ?? (/[A-Z]/.test(ch) ? ch : ""))))
    .join("");
}

export function capitalizeName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
