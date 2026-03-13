import type {
  CaptureInput,
  ReductionDetail,
  TokenInfo,
  TokenType,
  TokenValue,
} from "./types";

const TOKEN_PATTERNS: Array<{
  type: TokenType;
  regex: RegExp;
  value: (match: RegExpExecArray) => TokenValue | null;
}> = [
  {
    type: "time",
    regex: /\b(\d{1,2}):(\d{2})\b/g,
    value: (match) => {
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (minutes > 59 || hours > 23) {
        return null;
      }
      const iso = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      return {
        hours,
        minutes,
        iso,
        totalMinutes: hours * 60 + minutes,
      };
    },
  },
  {
    type: "percent",
    regex: /\b(\d{1,3})%(?=\s|$)/g,
    value: (match) => {
      const value = clamp(Number(match[1]), 0, 100);
      return { value };
    },
  },
  {
    type: "temp",
    regex: /\b(-?\d{1,2})°([CF])\b/g,
    value: (match) => ({
      value: Number(match[1]),
      unit: match[2] as "C" | "F",
    }),
  },
  {
    type: "consumption",
    regex: /\b(\d+(?:\.\d+)?)\s?L\/100km\b/gi,
    value: (match) => ({
      value: Number(match[1]),
    }),
  },
  {
    type: "distance",
    regex: /\b(\d+(?:\.\d+)?)\s?(km|mi)\b/gi,
    value: (match) => ({
      value: Number(match[1]),
      unit: match[2].toLowerCase() === "km" ? "km" : "mi",
    }),
  },
  {
    type: "fuel",
    regex: /\b(\d+(?:\.\d+)?)\s?L\b/gi,
    value: (match) => ({
      value: Number(match[1]),
    }),
  },
  {
    type: "count",
    regex: /\b\d{3,}\b/g,
    value: (match) => ({
      value: Number(match[0]),
    }),
  },
  {
    type: "tagged-code",
    regex: /\b([A-Z]{1,3})(\d{2,4})\b/g,
    value: (match) => ({
      prefix: match[1],
      digits: match[2],
      numeric: Number(match[2]),
    }),
  },
  {
    type: "code",
    regex: /\b\d{2,4}\b/g,
    value: (match) => ({
      value: match[0],
      numeric: Number(match[0]),
    }),
  },
];

export interface ParseOptions {
  percentThresholds?: {
    nearFull: number;
    seventies: [number, number];
  };
}

const DEFAULT_PERCENT_THRESHOLDS = {
  nearFull: 95,
  seventies: [70, 79] as [number, number],
};

export const FEATURE_FLAG = "FEATURE_VYBE_V4_READINGS";

export function extractTokens(
  raw: string,
  options?: ParseOptions
): TokenInfo[] {
  const matches: Array<{
    type: TokenType;
    start: number;
    end: number;
    raw: string;
    value: TokenValue;
  }> = [];

  const occupied: Array<{ start: number; end: number }> = [];

  TOKEN_PATTERNS.forEach(({ type, regex, value }) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (isOccupied(start, end, occupied)) {
        continue;
      }
      const tokenValue = value(match);
      if (!tokenValue) {
        continue;
      }
      matches.push({ type, start, end, raw: match[0], value: tokenValue });
      occupied.push({ start, end });
    }
  });

  matches.sort((a, b) => a.start - b.start || a.end - b.end);

  const percentThresholds = {
    nearFull: options?.percentThresholds?.nearFull ?? DEFAULT_PERCENT_THRESHOLDS.nearFull,
    seventies: options?.percentThresholds?.seventies ?? DEFAULT_PERCENT_THRESHOLDS.seventies,
  };

  return matches.map(({ type, start, end, raw: tokenRaw, value }) => {
    const reduction = buildReduction(tokenRaw);
    const token: TokenInfo = {
      raw: tokenRaw,
      type,
      value,
      start,
      end,
      flags: [],
      reduction,
    };

    if (type === "percent") {
      const percentValue = (value as { value: number }).value;
      if (percentValue >= percentThresholds.nearFull) {
        token.bucket = "near_full";
      } else if (
        percentValue >= percentThresholds.seventies[0] &&
        percentValue <= percentThresholds.seventies[1]
      ) {
        token.bucket = "seventies";
      } else if (percentValue === 88) {
        token.bucket = "88";
      }
    }

    return token;
  });
}

export function ensureTokens(input: CaptureInput, options?: ParseOptions): TokenInfo[] {
  if (Array.isArray(input.tokens) && input.tokens.length) {
    return input.tokens;
  }
  return extractTokens(input.raw, options);
}

function buildReduction(raw: string): ReductionDetail {
  const digits = collectDigits(raw);
  const steps: number[] = [];

  let current = digits.reduce((acc, digit) => acc + digit, 0);
  steps.push(current);

  while (current > 9 && current !== 11 && current !== 22 && current !== 33) {
    current = sumDigits(current);
    steps.push(current);
  }

  const detail: ReductionDetail = {
    digits,
    sum: digits.reduce((acc, digit) => acc + digit, 0),
    reduceTo: current,
    steps,
  };

  if (current === 11 || current === 22 || current === 33) {
    detail.master = current;
  }

  return detail;
}

function collectDigits(raw: string): number[] {
  return raw
    .split("")
    .filter((char) => /\d/.test(char))
    .map((digit) => Number(digit));
}

function sumDigits(value: number): number {
  return value
    .toString()
    .split("")
    .reduce((acc, char) => acc + Number(char), 0);
}

function isOccupied(
  start: number,
  end: number,
  occupied: Array<{ start: number; end: number }>
): boolean {
  return occupied.some((range) => intersects(range.start, range.end, start, end));
}

function intersects(
  existingStart: number,
  existingEnd: number,
  candidateStart: number,
  candidateEnd: number
): boolean {
  return (
    candidateStart < existingEnd &&
    candidateEnd > existingStart
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
