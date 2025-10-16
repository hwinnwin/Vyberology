export const lifePathDescriptions: Record<number, string> = {
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
  33: "Master Teacher – embodies compassion and spiritual service at the highest level."
};

export const expressionDescriptions: Record<number, string> = {
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
  33: "Master healer who teaches through embodied compassion and selfless service."
};

export const soulUrgeDescriptions: Record<number, string> = {
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
  33: "You desire to heal the world through unconditional love and spiritual teaching."
};

export const personalityDescriptions: Record<number, string> = {
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
  33: "You appear as a compassionate teacher and spiritual guide."
};

export const maturityDescriptions: Record<number, string> = {
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
  33: "In maturity, you embody the master teacher, healing through unconditional love."
};

export const chakraDescriptions: Record<string, string> = {
  'Root': "Grounded stability, survival, and physical manifestation",
  'Sacral': "Creative flow, emotional depth, and sensual expression",
  'Solar Plexus': "Personal power, willpower, and confident action",
  'Heart': "Compassion, love, and harmonious connection",
  'Throat': "Communication, truth, and authentic expression",
  'Third Eye': "Intuition, vision, and spiritual insight",
  'Crown': "Universal consciousness, enlightenment, and divine connection"
};

export function describeLifePath(n: number): string {
  return lifePathDescriptions[n] || "A unique path of discovery and growth.";
}

export function describeExpression(n: number): string {
  return expressionDescriptions[n] || "A distinctive way of expressing your gifts.";
}

export function describeSoulUrge(n: number): string {
  return soulUrgeDescriptions[n] || "A deep inner calling guiding your journey.";
}

export function describePersonality(n: number): string {
  return personalityDescriptions[n] || "A unique presence you bring to the world.";
}

export function describeMaturity(n: number): string {
  return maturityDescriptions[n] || "A path of continued growth and mastery.";
}

export function describeChakra(chakra: string): string {
  return chakraDescriptions[chakra] || "";
}
