import { Element, NumerologyResult, MASTER_NUMBERS } from "./types";

// Re-export types for convenience
export type { Element, NumerologyResult } from "./types";

/**
 * Reduces a number to a single digit, preserving master numbers (11, 22, 33)
 */
export function reduceToSingleDigit(num: number): number {
  // Return as-is if master number
  if (MASTER_NUMBERS.includes(num as (typeof MASTER_NUMBERS)[number])) {
    return num;
  }

  // Reduce until single digit or master number
  while (num > 9) {
    num = String(num)
      .split("")
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    if (MASTER_NUMBERS.includes(num as (typeof MASTER_NUMBERS)[number])) {
      return num;
    }
  }

  return num;
}

/**
 * Maps a core number to its corresponding element
 */
export function getElement(num: number): Element {
  const elementMap: Record<Element, number[]> = {
    fire: [1, 3, 9], // Action, creativity, completion
    earth: [4, 8, 22], // Stability, abundance, mastery
    air: [5, 7, 11], // Change, wisdom, illumination
    water: [2, 6, 33], // Balance, harmony, healing
  };

  for (const [element, numbers] of Object.entries(elementMap)) {
    if (numbers.includes(num)) {
      return element as Element;
    }
  }

  // Default fallback
  return "fire";
}

/**
 * Validates time string format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const pattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return pattern.test(time);
}

/**
 * Parses a time string and generates full numerology analysis
 */
export function analyzeTimestamp(time: string): NumerologyResult {
  if (!isValidTimeFormat(time)) {
    throw new Error("Invalid time format. Please use HH:MM format.");
  }

  const [hoursStr, minutesStr] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  // Calculate the sum of all digits
  const sum = hours + minutes;
  const coreNumber = reduceToSingleDigit(sum);
  const element = getElement(coreNumber);
  const isMasterNumber = MASTER_NUMBERS.includes(
    coreNumber as (typeof MASTER_NUMBERS)[number]
  );

  return {
    hours,
    minutes,
    sum,
    coreNumber,
    element,
    isMasterNumber,
    inputTime: time,
  };
}

/**
 * Formats current time as HH:MM
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Detects special number patterns
 */
export function detectPatterns(time: string): string[] {
  const patterns: string[] = [];
  const [hours, minutes] = time.split(":").map(Number);

  // Mirror numbers (like 12:21, 15:51)
  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");
  if (hoursStr === minutesStr.split("").reverse().join("")) {
    patterns.push("Mirror Time");
  }

  // Repeating numbers (like 11:11, 22:22)
  if (hoursStr === minutesStr && hoursStr[0] === hoursStr[1]) {
    patterns.push("Angel Number");
  }

  // Sequential (like 12:34)
  const allDigits = hoursStr + minutesStr;
  const isSequential = allDigits
    .split("")
    .every(
      (d, i, arr) => i === 0 || parseInt(d) === parseInt(arr[i - 1]) + 1
    );
  if (isSequential) {
    patterns.push("Sequential Time");
  }

  return patterns;
}
