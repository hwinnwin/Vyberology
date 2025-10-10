import { LETTER_MAP, VOWELS, normalizeName } from "./letterMap";
import { makeNumValue, NumValue } from "./reduce";

export function lettersToSum(name: string, predicate: (ch: string) => boolean): number {
  const norm = normalizeName(name);
  let sum = 0;
  for (const ch of norm) if (predicate(ch)) sum += LETTER_MAP[ch] || 0;
  return sum;
}

export const sumAllLetters = (name: string) => lettersToSum(name, () => true);
export const sumVowels = (name: string) => lettersToSum(name, (ch) => VOWELS.has(ch));
export const sumConsonants = (name: string) => lettersToSum(name, (ch) => !VOWELS.has(ch));

export function lifePathFromDOB(dobISO: string): NumValue {
  const m = dobISO.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!m) {
    const digits = dobISO.replace(/\D+/g, "");
    const raw = digits.split("").reduce((a, d) => a + Number(d), 0);
    return makeNumValue(raw, true);
  }
  const [, year, month, day] = m;
  const raw = Number(day) + Number(month) + Number(year);
  return makeNumValue(raw, true);
}

export function expressionFromName(name: string): NumValue {
  return makeNumValue(sumAllLetters(name), true);
}
export function soulUrgeFromName(name: string): NumValue {
  return makeNumValue(sumVowels(name), true);
}
export function personalityFromName(name: string): NumValue {
  return makeNumValue(sumConsonants(name), true);
}
export function maturityNumber(expression: NumValue, lifePath: NumValue): NumValue {
  return makeNumValue(expression.value + lifePath.value, true);
}

export type NumerologyNumbers = {
  lifePath: NumValue;
  expression: NumValue;
  soulUrge: NumValue;
  personality: NumValue;
  maturity: NumValue;
};

export function computeAll(fullName: string, dobISO: string): NumerologyNumbers {
  const lifePath = lifePathFromDOB(dobISO);
  const expression = expressionFromName(fullName);
  const soulUrge = soulUrgeFromName(fullName);
  const personality = personalityFromName(fullName);
  const maturity = maturityNumber(expression, lifePath);
  return { lifePath, expression, soulUrge, personality, maturity };
}
