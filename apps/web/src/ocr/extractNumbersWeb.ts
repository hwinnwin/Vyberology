import Tesseract from "tesseract.js";
import type { NumberToken, NumberUnit } from "@vybe/reading-engine";

type ImageSource = string | File | Blob; // added by Lumen (Stage 4A)

const TIME = /\b(?:(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?(?:AM|PM|am|pm))?)\b/;
const TEMP = /\b-?\d{1,3}\s?(?:°\s?)?(?:C|F|°C|°F)\b/;
const PERCENT = /\b\d{1,3}(?:[.,]\d{1,2})?\s?%\b/;
const COUNT = /\b\d{1,3}(?:[.,]\d{3})+\b/;
const PLAIN = /\b\d{1,4}\b/;

export async function recognizeText(src: ImageSource) {
  const worker = await Tesseract.createWorker();
  await worker.setParameters({ tessedit_char_whitelist: "0123456789:%°CFcf .:-APMapm" });
  const { data } = await worker.recognize(src as Tesseract.ImageLike);
  await worker.terminate();
  return { text: data.text ?? "", confidence: (data.confidence ?? 0) / 100 };
}

export function parseTokens(text: string, baseConf = 0.7): NumberToken[] {
  const tokens: NumberToken[] = [];
  const push = (raw: string, unit: NumberUnit, values: number[]) =>
    tokens.push({ raw, unit, values, confidence: baseConf });

  for (const m of text.matchAll(TIME)) {
    const [h, min] = m[0]
      .replace(/\s?(AM|PM|am|pm)$/, "")
      .split(":")
      .map((n) => +n);
    push(m[0], "time", [h, min]);
  }
  for (const m of text.matchAll(TEMP)) {
    const n = parseInt(m[0].replace(/[^\d-]/g, ""), 10);
    push(m[0], "temperature", [n]);
  }
  for (const m of text.matchAll(PERCENT)) {
    const n = parseFloat(m[0].replace("%", "").replace(",", "."));
    push(m[0], "percent", [n]);
  }
  for (const m of text.matchAll(COUNT)) {
    const n = parseInt(m[0].replace(/[.,]/g, ""), 10);
    push(m[0], "count", [n]);
  }
  if (!TIME.test(text) && !TEMP.test(text) && !PERCENT.test(text) && !COUNT.test(text)) {
    for (const m of text.matchAll(PLAIN)) {
      const v = parseInt(m[0], 10);
      if (!Number.isNaN(v)) push(m[0], "plain", [v]);
    }
  }

  return tokens
    .filter((t, i, a) => a.findIndex((x) => x.raw === t.raw && x.unit === t.unit) === i)
    .sort((a, b) => b.confidence - a.confidence);
}

export function extractNumbers(input: string): number[] { // added by Lumen (Stage 4A)
  return (input.match(/\d+/g) ?? []).map(Number); // added by Lumen (Stage 4A)
}
