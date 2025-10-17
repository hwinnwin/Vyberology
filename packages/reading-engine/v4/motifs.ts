import type { Motif, TimeTokenValue, TokenInfo, TokenType } from "./types";

const ARRIVAL_KEYWORDS = ["arrive", "arriving", "arrival", "return home", "back home"];

const MOTIF_PRIORITY: Motif[] = [
  "arrival",
  "gateway_11",
  "mirror_time",
  "shift_555",
  "heart_6_stack",
  "builder_44_1144",
  "abundance_signature",
  "percent_near_full",
  "progression",
  "triple",
];

export function detectMotifs(tokens: TokenInfo[], context?: string): Motif[] {
  const detected = new Set<Motif>();
  const timeTokens = tokens.filter((token) => token.type === "time");

  tokens.forEach((token) => {
    const tokenFlags: Motif[] = [];
    if (token.type === "time" && isMirrorTime((token.value as TimeTokenValue).iso)) {
      tokenFlags.push("mirror_time");
    } else if (token.type !== "time" && isMirrorNumeric(token.raw)) {
      tokenFlags.push("mirror_time");
    }

    if (isGateway(token)) {
      tokenFlags.push("gateway_11");
    }

    if (isTriple(token.raw)) {
      tokenFlags.push("triple");
    }

    if (isShift555(token.raw)) {
      tokenFlags.push("shift_555");
    }

    if (isHeartStack(token)) {
      tokenFlags.push("heart_6_stack");
    }

    if (isBuilderPattern(token.raw)) {
      tokenFlags.push("builder_44_1144");
    }

    if (isAbundance(token.raw)) {
      tokenFlags.push("abundance_signature");
    }

    if (token.bucket === "near_full") {
      tokenFlags.push("percent_near_full");
    }

    token.flags.push(...dedupeMotifs(token.flags.concat(tokenFlags)));
    tokenFlags.forEach((flag) => detected.add(flag));
  });

  if (timeTokens.length >= 2 && isProgression(timeTokens)) {
    detected.add("progression");
    timeTokens.forEach((token) => {
      if (!token.flags.includes("progression")) {
        token.flags.push("progression");
      }
    });
  }

  if (isArrival(tokens, context)) {
    detected.add("arrival");
    tokens.forEach((token) => {
      if (token.type === "distance" || token.type === "fuel" || token.type === "consumption") {
        if (!token.flags.includes("arrival")) {
          token.flags.push("arrival");
        }
      }
    });
  }

  return MOTIF_PRIORITY.filter((motif) => detected.has(motif));
}

function dedupeMotifs(flags: Motif[]): Motif[] {
  return Array.from(new Set(flags));
}

function isMirrorTime(iso: string): boolean {
  const [hours, minutes] = iso.split(":");
  if (hours.length === 1 || minutes.length !== 2) {
    return hours.padStart(2, "0") === reverseString(minutes);
  }
  return hours === reverseString(minutes);
}

function isMirrorNumeric(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 1 && digits === reverseString(digits);
}

function reverseString(input: string): string {
  return input.split("").reverse().join("");
}

function isGateway(token: TokenInfo): boolean {
  const raw = token.raw;
  if (raw.includes("11")) {
    return true;
  }
  if (token.type === "distance" || token.type === "consumption" || token.type === "fuel") {
    return raw.startsWith("11.") || raw.endsWith(".11");
  }
    if (token.type === "time") {
      return (token.value as TimeTokenValue).iso === "11:11";
    }
  const digits = raw.replace(/\D/g, "");
  return digits === "111" || digits === "1111";
}

function isTriple(raw: string): boolean {
  return /(\d)\1\1/.test(raw.replace(/\D/g, ""));
}

function isShift555(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.includes("555") || raw.includes("15:55");
}

function isHeartStack(token: TokenInfo): boolean {
  if (token.reduction.reduceTo !== 6) {
    return false;
  }
  const digits = token.raw.replace(/\D/g, "");
  return digits.includes("6") && digits.length >= 3;
}

function isBuilderPattern(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.includes("44") || digits.includes("1144");
}

function isAbundance(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.includes("88") || /^8+$/.test(digits);
}

function isProgression(timeTokens: TokenInfo[]): boolean {
  const minutesList = timeTokens
    .map((token) => (token.value as TimeTokenValue).totalMinutes)
    .sort((a, b) => a - b);
  if (minutesList.length < 2) {
    return false;
  }
  let consecutive = 1;
  for (let index = 1; index < minutesList.length; index += 1) {
    if (minutesList[index] - minutesList[index - 1] === 1) {
      consecutive += 1;
      if (consecutive >= 3) {
        return true;
      }
    } else {
      consecutive = 1;
    }
  }
  return false;
}

function isArrival(tokens: TokenInfo[], context?: string): boolean {
  const hasDistance = tokens.some((token) => token.type === "distance");
  const hasFuelOrConsumption = tokens.some(
    (token) => token.type === "fuel" || token.type === "consumption"
  );

  if (!hasDistance && !hasFuelOrConsumption) {
    return false;
  }

  if (
    context &&
    ARRIVAL_KEYWORDS.some((keyword) => context.toLowerCase().includes(keyword))
  ) {
    return true;
  }

  const distanceToken = tokens.find((token) => token.type === "distance");

  if (hasDistance && hasFuelOrConsumption) {
    return true;
  }

  return Boolean(
    distanceToken &&
    "value" in distanceToken.value &&
    (distanceToken.value as { value: number }).value === 77
  );
}

export function motifStrength(motif: Motif): number {
  return MOTIF_PRIORITY.indexOf(motif);
}

export function dominantMotif(tokens: TokenInfo[], motifs: Motif[]): Motif | undefined {
  if (!motifs.length) {
    return undefined;
  }
  for (const motif of MOTIF_PRIORITY) {
    if (motifs.includes(motif)) {
      return motif;
    }
  }
  return motifs[0];
}
