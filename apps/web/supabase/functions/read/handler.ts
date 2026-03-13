import type { CoreNumbers, NumerologyValue, Result } from "@vybe/reading-engine"; // added by Lumen (Stage 4A)

// added by Lumen (Stage 4A PR1-DI)
export type ReadRequest = { fullName: string; dob: string }; // added by Lumen (Stage 4A PR1-DI)

export type ReadErr = { code: "BAD_REQUEST"; message: string }; // added by Lumen (Stage 4A PR1-DI)

export type ChakraName = "Root" | "Sacral" | "Solar Plexus" | "Heart" | "Throat" | "Third Eye" | "Crown"; // added by Lumen (Stage 4A PR1-DI)

export interface ChakraMapping { // added by Lumen (Stage 4A PR1-DI)
  lifePath: ChakraName;
  expression: ChakraName;
  soulUrge: ChakraName;
  personality: ChakraName;
  maturity: ChakraName;
} // added by Lumen (Stage 4A PR1-DI)

export interface ChakraSummary { // added by Lumen (Stage 4A PR1-DI)
  dominant: ChakraName;
  bridge: ChakraName;
  mapping: ChakraMapping;
} // added by Lumen (Stage 4A PR1-DI)

export interface ReadingSummary { // added by Lumen (Stage 4A PR1-DI)
  frequencyProfile: string;
  energyField: string;
  insight: string;
  detailedSummary: string;
} // added by Lumen (Stage 4A PR1-DI)

export interface ReadOk { // added by Lumen (Stage 4A PR1-DI)
  input: { fullName: string; dob: string };
  numbers: CoreNumbers;
  chakras: ChakraSummary;
  reading: ReadingSummary;
} // added by Lumen (Stage 4A PR1-DI)

const LETTER_MAP: Record<string, number> = { // added by Lumen (Stage 4A PR1-DI)
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
}; // added by Lumen (Stage 4A PR1-DI)

const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]); // added by Lumen (Stage 4A PR1-DI)

const FOLD: Record<string, string> = { // added by Lumen (Stage 4A PR1-DI)
  Á: "A", À: "A", Â: "A", Ä: "A", Ã: "A", Å: "A", Ā: "A",
  É: "E", È: "E", Ê: "E", Ë: "E", Ē: "E",
  Í: "I", Ì: "I", Î: "I", Ï: "I", Ī: "I",
  Ó: "O", Ò: "O", Ô: "O", Ö: "O", Õ: "O", Ō: "O",
  Ú: "U", Ù: "U", Û: "U", Ü: "U", Ū: "U",
  Ý: "Y", Ÿ: "Y", Ñ: "N", Ç: "C", Ś: "S", Ż: "Z", Ź: "Z", Ł: "L",
}; // added by Lumen (Stage 4A PR1-DI)

const LABELS: Record<number, string> = { // added by Lumen (Stage 4A PR1-DI)
  1: "Initiator",
  2: "Peacemaker",
  3: "Creator",
  4: "Builder",
  5: "Messenger",
  6: "Harmonizer",
  7: "Seer",
  8: "Executive",
  9: "Humanitarian",
  11: "Visionary",
  22: "Master Builder",
  33: "Master Teacher",
}; // added by Lumen (Stage 4A PR1-DI)

const NUMEROLOGY_MAP: Record<number, { headline: string; keywords: string[]; guidance: string }> = { // added by Lumen (Stage 4A PR1-DI)
  0: {
    headline: "Divine Zero",
    keywords: ["infinite potential", "reset", "source", "void", "beginning"],
    guidance: "You stand at the threshold of infinite possibility. The zero represents the cosmic womb from which all creation emerges.",
  },
  1: {
    headline: "The Initiator",
    keywords: ["new beginning", "leadership", "independence", "confidence"],
    guidance: "You are being called to step forward and lead. This is your moment to initiate and create.",
  },
  2: {
    headline: "The Harmonizer",
    keywords: ["balance", "cooperation", "partnership", "diplomacy"],
    guidance: "Seek harmony and balance. Partnerships and collaboration will bring success.",
  },
  3: {
    headline: "The Creator",
    keywords: ["joy", "expression", "creativity", "communication"],
    guidance: "Express yourself freely. Your creative energy is flowing and wants to be shared.",
  },
  4: {
    headline: "The Builder",
    keywords: ["structure", "foundation", "stability", "discipline"],
    guidance: "Build solid foundations. Focus on practical matters and creating lasting structures.",
  },
  5: {
    headline: "Freedom Seeker",
    keywords: ["change", "adapt", "freedom", "adventure"],
    guidance: "Embrace change and new experiences. Freedom comes through adaptability.",
  },
  6: {
    headline: "The Nurturer",
    keywords: ["care", "harmony", "responsibility", "service"],
    guidance: "Care for yourself and others. Create harmony in your relationships and environment.",
  },
  7: {
    headline: "The Seeker",
    keywords: ["wisdom", "spirit", "introspection", "truth"],
    guidance: "Seek deeper understanding. Trust your inner wisdom and spiritual insights.",
  },
  8: {
    headline: "The Powerhouse",
    keywords: ["abundance", "authority", "power", "manifestation"],
    guidance: "Step into your power. Abundance and success are within your reach.",
  },
  9: {
    headline: "The Humanitarian",
    keywords: ["completion", "legacy", "wisdom", "service"],
    guidance: "A cycle is completing. Share your wisdom and create a lasting legacy.",
  },
  11: {
    headline: "The Visionary",
    keywords: ["intuition", "downloads", "spiritual insight", "illumination"],
    guidance: "You are receiving divine downloads. Trust your heightened intuition and inner visions.",
  },
  22: {
    headline: "The Master Builder",
    keywords: ["architecture", "legacy", "manifestation", "grand vision"],
    guidance: "You have the power to build something lasting and significant. Think big and act strategically.",
  },
  33: {
    headline: "The Master Teacher",
    keywords: ["love", "healing", "compassion", "guidance"],
    guidance: "You are here to heal and teach through unconditional love. Share your gifts with the world.",
  },
  44: {
    headline: "The Master Organizer",
    keywords: ["systems", "empire", "discipline", "mastery"],
    guidance: "Build powerful systems and structures. Your organizational mastery can create an empire.",
  },
}; // added by Lumen (Stage 4A PR1-DI)

const NUM_TO_CHAKRA: Record<number, ChakraName> = { // added by Lumen (Stage 4A PR1-DI)
  1: "Root",
  8: "Root",
  2: "Sacral",
  11: "Sacral",
  3: "Solar Plexus",
  9: "Solar Plexus",
  4: "Heart",
  6: "Heart",
  5: "Throat",
  7: "Third Eye",
  22: "Crown",
  33: "Crown",
}; // added by Lumen (Stage 4A PR1-DI)

const lifePathDescriptions: Record<number, string> = { // added by Lumen (Stage 4A PR1-DI)
  1: "Independent Leader – initiates new paths, pioneers change, and thrives on self-reliance.",
  2: "Peacemaker – brings balance, diplomacy, and partnership to all endeavors.",
  3: "Creator – expresses through art, communication, and joyful self-expression.",
  4: "Builder – creates solid foundations, structures, and practical systems.",
  5: "Messenger – seeks freedom, adventure, and dynamic change.",
  6: "Harmonizer – creates beauty, community, and nurturing environments.",
  7: "Seer – pursues deep knowledge, spiritual wisdom, and introspection.",
  8: "Material Master – organizes power, prosperity, and material success.",
  9: "Humanitarian – serves the greater good with compassion and completion.",
  11: "Illuminator – spiritual visionary bringing light to systems and awakening consciousness.",
  22: "Master Builder – turns dreams into structure, manifesting large-scale vision.",
  33: "Master Teacher – embodies compassion and spiritual service at the highest level.",
}; // added by Lumen (Stage 4A PR1-DI)

const expressionDescriptions: Record<number, string> = { // added by Lumen (Stage 4A PR1-DI)
  1: "Natural leader with strong willpower and determination to forge your own path.",
  2: "Diplomatic mediator who excels at cooperation and creating harmony.",
  3: "Creative communicator with a gift for self-expression and inspiring others.",
  4: "Practical organizer who builds lasting systems and values hard work.",
  5: "Dynamic adventurer who thrives on change, freedom, and exploration.",
  6: "Nurturing caretaker who creates beauty and serves the community.",
  7: "Analytical thinker who seeks truth through research and contemplation.",
  8: "Powerful executive who manifests material success and manages resources.",
  9: "Compassionate humanitarian who works for universal good and completion.",
  11: "Intuitive visionary who channels higher wisdom and inspires spiritual growth.",
  22: "Master architect who builds systems that transform society at scale.",
  33: "Master healer who teaches through embodied compassion and selfless service.",
}; // added by Lumen (Stage 4A PR1-DI)

const soulUrgeDescriptions: Record<number, string> = { // added by Lumen (Stage 4A PR1-DI)
  1: "Your soul craves independence, leadership, and the courage to stand alone.",
  2: "You deeply desire partnership, peace, and harmonious relationships.",
  3: "Your heart yearns for creative expression, joy, and sharing your gifts.",
  4: "You seek security, order, and the satisfaction of building something lasting.",
  5: "Your soul hungers for freedom, variety, and adventurous experiences.",
  6: "You desire to nurture, create harmony, and serve your community.",
  7: "Your inner self seeks wisdom, spiritual understanding, and solitude for reflection.",
  8: "You crave material success, recognition, and the power to create abundance.",
  9: "Your soul desires to serve humanity, complete cycles, and give selflessly.",
  11: "You yearn for spiritual illumination, to inspire others, and serve higher purpose.",
  22: "Your soul seeks to manifest grand visions and build lasting legacy.",
  33: "You desire to heal the world through unconditional love and spiritual teaching.",
}; // added by Lumen (Stage 4A PR1-DI)

const personalityDescriptions: Record<number, string> = { // added by Lumen (Stage 4A PR1-DI)
  1: "You appear confident, independent, and pioneering to others.",
  2: "You come across as gentle, diplomatic, and approachable.",
  3: "You radiate creativity, charm, and expressive energy.",
  4: "You project stability, reliability, and methodical competence.",
  5: "You appear dynamic, adventurous, and freedom-loving.",
  6: "You seem nurturing, responsible, and community-oriented.",
  7: "You appear mysterious, analytical, and introspective.",
  8: "You project authority, power, and material success.",
  9: "You seem compassionate, wise, and universally caring.",
  11: "You radiate spiritual awareness and inspirational energy.",
  22: "You project visionary capability and master-builder energy.",
  33: "You appear as a compassionate teacher and spiritual guide.",
}; // added by Lumen (Stage 4A PR1-DI)

const maturityDescriptions: Record<number, string> = { // added by Lumen (Stage 4A PR1-DI)
  1: "In maturity, you become a self-assured leader who initiates with confidence.",
  2: "In maturity, you master the art of partnership and diplomatic influence.",
  3: "In maturity, you fully embody creative expression and joyful communication.",
  4: "In maturity, you build enduring structures and systems with mastery.",
  5: "In maturity, you embrace adaptability and inspire others to explore freely.",
  6: "In maturity, you create harmonious environments and nurture with wisdom.",
  7: "In maturity, you become a wise sage who shares deep spiritual insights.",
  8: "In maturity, you wield power responsibly and create lasting abundance.",
  9: "In maturity, you serve humanity with compassion and complete important cycles.",
  11: "In maturity, you illuminate spiritual truths and inspire collective awakening.",
  22: "In maturity, you manifest visionary projects that transform society.",
  33: "In maturity, you embody the master teacher, healing through unconditional love.",
}; // added by Lumen (Stage 4A PR1-DI)

const chakraDescriptions: Record<ChakraName, string> = { // added by Lumen (Stage 4A PR1-DI)
  Root: "Grounded stability, survival, and physical manifestation",
  Sacral: "Creative flow, emotional depth, and sensual expression",
  "Solar Plexus": "Personal power, willpower, and confident action",
  Heart: "Compassion, love, and harmonious connection",
  Throat: "Communication, truth, and authentic expression",
  "Third Eye": "Intuition, vision, and spiritual insight",
  Crown: "Universal consciousness, enlightenment, and divine connection",
}; // added by Lumen (Stage 4A PR1-DI)

export function isReadRequest(value: unknown): value is ReadRequest { // added by Lumen (Stage 4A PR1-DI)
  if (!value || typeof value !== "object") return false; // added by Lumen (Stage 4A PR1-DI)
  const record = value as Record<string, unknown>; // added by Lumen (Stage 4A PR1-DI)
  return typeof record.fullName === "string" && record.fullName.trim().length > 0 && typeof record.dob === "string" && record.dob.trim().length > 0; // added by Lumen (Stage 4A PR1-DI)
} // added by Lumen (Stage 4A PR1-DI)

export function prepareReadResult(payload: unknown): Result<ReadOk, ReadErr> { // added by Lumen (Stage 4A PR1-DI)
  if (!isReadRequest(payload)) { // added by Lumen (Stage 4A PR1-DI)
    return { ok: false, error: { code: "BAD_REQUEST", message: "fullName and dob are required" } }; // added by Lumen (Stage 4A PR1-DI)
  } // added by Lumen (Stage 4A PR1-DI)

  const trimmed: ReadRequest = { // added by Lumen (Stage 4A PR1-DI)
    fullName: payload.fullName.trim(),
    dob: payload.dob.trim(),
  }; // added by Lumen (Stage 4A PR1-DI)

  const capitalizedName = capitalizeName(trimmed.fullName); // added by Lumen (Stage 4A PR1-DI)
  const numbers = computeAll(trimmed.fullName, trimmed.dob); // added by Lumen (Stage 4A PR1-DI)
  const chakras = mapChakras(numbers); // added by Lumen (Stage 4A PR1-DI)
  const reading: ReadingSummary = { // added by Lumen (Stage 4A PR1-DI)
    frequencyProfile: makeFrequencyProfile(numbers),
    energyField: `Dominant: ${chakras.dominant} · Bridge: ${chakras.bridge}`,
    insight: makeAppliedCue(numbers, chakras),
    detailedSummary: makeDetailedSummary(capitalizedName, trimmed.dob, numbers, chakras),
  }; // added by Lumen (Stage 4A PR1-DI)

  return { // added by Lumen (Stage 4A PR1-DI)
    ok: true,
    value: {
      input: { fullName: capitalizedName, dob: trimmed.dob },
      numbers,
      chakras,
      reading,
    },
  }; // added by Lumen (Stage 4A PR1-DI)
} // added by Lumen (Stage 4A PR1-DI)

function capitalizeName(name: string): string { // added by Lumen (Stage 4A PR1-DI)
  if (!name) return ""; // added by Lumen (Stage 4A PR1-DI)
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
} // added by Lumen (Stage 4A PR1-DI)

function normalizeName(input: string): string { // added by Lumen (Stage 4A PR1-DI)
  if (!input) return "";
  return input
    .toUpperCase()
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (LETTER_MAP[ch]) return ch;
      if (FOLD[ch]) return FOLD[ch];
      if (code >= 65 && code <= 90) return ch;
      return "";
    })
    .join("");
} // added by Lumen (Stage 4A PR1-DI)

function sumDigits(n: number): number { // added by Lumen (Stage 4A PR1-DI)
  return String(n)
    .split("")
    .reduce((total, digit) => total + Number(digit), 0);
} // added by Lumen (Stage 4A PR1-DI)

function isMasterNumber(n: number): boolean { // added by Lumen (Stage 4A PR1-DI)
  return n === 11 || n === 22 || n === 33 || n === 44;
} // added by Lumen (Stage 4A PR1-DI)

function reduceNumber(n: number): number { // added by Lumen (Stage 4A PR1-DI)
  if (isMasterNumber(n)) return n;
  let total = n;
  while (total > 9 && !isMasterNumber(total)) {
    total = sumDigits(total);
  }
  return total;
} // added by Lumen (Stage 4A PR1-DI)

function makeNumValue(raw: number): NumerologyValue { // added by Lumen (Stage 4A PR1-DI)
  const reduced = reduceNumber(raw);
  return { raw, value: reduced, isMaster: isMasterNumber(reduced) };
} // added by Lumen (Stage 4A PR1-DI)

function lettersToSum(name: string, predicate: (ch: string) => boolean): number { // added by Lumen (Stage 4A PR1-DI)
  const norm = normalizeName(name);
  let sum = 0;
  for (const ch of norm) {
    if (predicate(ch)) sum += LETTER_MAP[ch] ?? 0;
  }
  return sum;
} // added by Lumen (Stage 4A PR1-DI)

function sumAllLetters(name: string): number { // added by Lumen (Stage 4A PR1-DI)
  return lettersToSum(name, () => true);
} // added by Lumen (Stage 4A PR1-DI)

function sumVowels(name: string): number { // added by Lumen (Stage 4A PR1-DI)
  return lettersToSum(name, (ch) => VOWELS.has(ch));
} // added by Lumen (Stage 4A PR1-DI)

function sumConsonants(name: string): number { // added by Lumen (Stage 4A PR1-DI)
  return lettersToSum(name, (ch) => !VOWELS.has(ch));
} // added by Lumen (Stage 4A PR1-DI)

function lifePathFromDOB(dobISO: string): NumerologyValue { // added by Lumen (Stage 4A PR1-DI)
  const match = dobISO.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const digits = dobISO.replace(/[^0-9]/g, "");
    const fallback = digits.split("").reduce((a, d) => a + Number(d), 0);
    return makeNumValue(fallback);
  }
  const [, year, month, day] = match;
  const raw = Number(day) + Number(month) + Number(year);
  return makeNumValue(raw);
} // added by Lumen (Stage 4A PR1-DI)

function expressionFromName(name: string): NumerologyValue { // added by Lumen (Stage 4A PR1-DI)
  return makeNumValue(sumAllLetters(name));
} // added by Lumen (Stage 4A PR1-DI)

function soulUrgeFromName(name: string): NumerologyValue { // added by Lumen (Stage 4A PR1-DI)
  return makeNumValue(sumVowels(name));
} // added by Lumen (Stage 4A PR1-DI)

function personalityFromName(name: string): NumerologyValue { // added by Lumen (Stage 4A PR1-DI)
  return makeNumValue(sumConsonants(name));
} // added by Lumen (Stage 4A PR1-DI)

function maturityNumber(expression: NumerologyValue, lifePath: NumerologyValue): NumerologyValue { // added by Lumen (Stage 4A PR1-DI)
  return makeNumValue(expression.value + lifePath.value);
} // added by Lumen (Stage 4A PR1-DI)

function computeAll(fullName: string, dobISO: string): CoreNumbers { // added by Lumen (Stage 4A PR1-DI)
  const lifePath = lifePathFromDOB(dobISO);
  const expression = expressionFromName(fullName);
  const soulUrge = soulUrgeFromName(fullName);
  const personality = personalityFromName(fullName);
  const maturity = maturityNumber(expression, lifePath);
  return { lifePath, expression, soulUrge, personality, maturity };
} // added by Lumen (Stage 4A PR1-DI)

function mapNum(n: number): ChakraName { // added by Lumen (Stage 4A PR1-DI)
  return NUM_TO_CHAKRA[n] ?? "Root";
} // added by Lumen (Stage 4A PR1-DI)

function mapChakras(nums: CoreNumbers): ChakraSummary { // added by Lumen (Stage 4A PR1-DI)
  const mapping: ChakraMapping = {
    lifePath: mapNum(nums.lifePath.value),
    expression: mapNum(nums.expression.value),
    soulUrge: mapNum(nums.soulUrge.value),
    personality: mapNum(nums.personality.value),
    maturity: mapNum(nums.maturity.value),
  };

  const counts = new Map<ChakraName, number>();
  (Object.values(mapping) as ChakraName[]).forEach((chakra) => {
    counts.set(chakra, (counts.get(chakra) ?? 0) + 1);
  });

  let dominant: ChakraName = "Root";
  let dominantCount = -1;
  counts.forEach((count, chakra) => {
    if (count > dominantCount) {
      dominant = chakra;
      dominantCount = count;
    }
  });

  const masterChakras = [nums.lifePath, nums.expression, nums.soulUrge, nums.personality, nums.maturity]
    .filter((value) => value.isMaster)
    .map((value) => mapNum(value.value));

  let bridge: ChakraName = dominant;
  if (masterChakras.length > 0) {
    bridge = masterChakras.includes("Crown") ? "Crown" : masterChakras[0];
  } else {
    let secondary: ChakraName = dominant;
    let secondaryCount = -1;
    counts.forEach((count, chakra) => {
      if (chakra === dominant) return;
      if (count > secondaryCount) {
        secondary = chakra;
        secondaryCount = count;
      }
    });
    bridge = secondaryCount > 0 && secondary !== dominant ? secondary : "Root";
  }

  return { dominant, bridge, mapping };
} // added by Lumen (Stage 4A PR1-DI)

function tag(n: number): string { // added by Lumen (Stage 4A PR1-DI)
  return LABELS[n] ? `${n} (${LABELS[n]})` : String(n);
} // added by Lumen (Stage 4A PR1-DI)

function makeFrequencyProfile(nums: CoreNumbers): string { // added by Lumen (Stage 4A PR1-DI)
  const parts = [
    `Life Path ${tag(nums.lifePath.value)}`,
    `Expression ${tag(nums.expression.value)}`,
    `Soul Urge ${tag(nums.soulUrge.value)}`,
    `Personality ${tag(nums.personality.value)}`,
    `Maturity ${tag(nums.maturity.value)}`,
  ];
  return parts.join(" · ");
} // added by Lumen (Stage 4A PR1-DI)

function makeAppliedCue(nums: CoreNumbers, chakras: ChakraSummary): string { // added by Lumen (Stage 4A PR1-DI)
  const lp = nums.lifePath.value;
  const ex = nums.expression.value;

  const lead =
    lp === 11 ? "Lead with your vision and intuition" :
    lp === 6 ? "Center harmony and service" :
    lp === 8 ? "Own the decision and the numbers" :
    lp === 7 ? "Take 30 minutes for research before moving" :
    lp === 5 ? "Share a message publicly today" :
    "Take one decisive step";

  const build =
    ex === 22 ? "translate the idea into a simple system (3 steps, 1 owner, 24h)" :
    ex === 8 ? "codify it into a concrete plan with budget + timeline" :
    ex === 4 ? "lay a checklist and ship v1" :
    ex === 3 ? "shape it into a story or demo" :
    "write a one-pager and act on the first bullet";

  return `${lead}, then ${build}. Energy: Dominant ${chakras.dominant}, Bridge ${chakras.bridge}.`;
} // added by Lumen (Stage 4A PR1-DI)

function makeDetailedSummary(
  fullName: string,
  dob: string,
  nums: CoreNumbers,
  chakras: ChakraSummary,
): string {
  const chakraFlow = [
    chakras.mapping.lifePath,
    chakras.mapping.expression,
    chakras.mapping.soulUrge,
    chakras.mapping.personality,
    chakras.mapping.maturity,
  ].filter((value, index, array) => array.indexOf(value) === index);

  const lp = nums.lifePath.value;
  const ex = nums.expression.value;
  const su = nums.soulUrge.value;

  let synthesis = "";

  if (lp === 11) {
    synthesis += "Your spiritual vision illuminates the path forward. ";
  } else if (lp === 22) {
    synthesis += "You are here to build systems that transform the world. ";
  } else if (lp === 6) {
    synthesis += "You create harmony and beauty wherever you go. ";
  } else if (lp === 8) {
    synthesis += "You master material reality and organize resources with power. ";
  } else if (lp === 1) {
    synthesis += "You pioneer new paths with courage and independence. ";
  } else {
    synthesis += `Your ${LABELS[lp] || "unique"} path shapes your journey. `;
  }

  if (ex === 22) {
    synthesis += "Express this through master-building—create tangible systems with clear structure and timeline. ";
  } else if (ex === 8) {
    synthesis += "Express this through executive action—codify plans with budget, metrics, and accountability. ";
  } else if (ex === 3) {
    synthesis += "Express this through creative storytelling—shape your vision into compelling narrative. ";
  } else if (ex === 4) {
    synthesis += "Express this through methodical building—create checklists and ship incrementally. ";
  } else {
    synthesis += `Your ${LABELS[ex] || "expression"} nature channels this energy outward. `;
  }

  if (su === 11 || su === 22 || su === 33) {
    synthesis += `Your soul's master calling (${su}) demands you serve a higher purpose beyond personal gain. `;
  } else if (su === 8) {
    synthesis += "Deep within, you crave abundance and recognition—honor this while serving others. ";
  } else if (su === 6) {
    synthesis += "Your heart seeks to nurture and create beauty—this is your true compass. ";
  }

  synthesis += `

Your energy centers anchor in ${chakras.dominant} (${(chakraDescriptions[chakras.dominant] || "").toLowerCase()}), `;
  synthesis += `with ${chakras.bridge} acting as your bridge to higher consciousness. `;
  synthesis += "Work consciously with these centers to align action with essence.";

  return `✨ ${fullName}
Born ${dob}

CORE NUMBERS

Life Path ${nums.lifePath.value}${nums.lifePath.isMaster ? " (Master)" : ""}: ${lifePathDescriptions[nums.lifePath.value] || "A unique path of discovery."}

Expression ${nums.expression.value}${nums.expression.isMaster ? " (Master)" : ""}: ${expressionDescriptions[nums.expression.value] || "A distinctive expression."}

Soul Urge ${nums.soulUrge.value}${nums.soulUrge.isMaster ? " (Master)" : ""}: ${soulUrgeDescriptions[nums.soulUrge.value] || "A deep inner calling."}

Personality ${nums.personality.value}${nums.personality.isMaster ? " (Master)" : ""}: ${personalityDescriptions[nums.personality.value] || "A unique presence."}

Maturity ${nums.maturity.value}${nums.maturity.isMaster ? " (Master)" : ""}: ${maturityDescriptions[nums.maturity.value] || "A path of growth."}

ENERGY CENTERS

Dominant Chakra: ${chakras.dominant} – ${chakraDescriptions[chakras.dominant] || ""}
Bridge Chakra: ${chakras.bridge} – ${chakraDescriptions[chakras.bridge] || ""}
Chakra Flow: ${chakraFlow.join(" → ")}

INTEGRATED READING

${synthesis}`;


}
