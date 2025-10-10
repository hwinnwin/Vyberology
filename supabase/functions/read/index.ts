import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pythagorean map A=1..I=9, J=1..R=9, S=1..Z=8
const LETTER_MAP: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
};

const VOWELS = new Set(['A','E','I','O','U','Y']);

// Basic ASCII fold for a few common diacritics
const FOLD: Record<string,string> = {
  Á:'A',À:'A',Â:'A',Ä:'A',Ã:'A',Å:'A',Ā:'A',
  É:'E',È:'E',Ê:'E',Ë:'E',Ē:'E',
  Í:'I',Ì:'I',Î:'I',Ï:'I',Ī:'I',
  Ó:'O',Ò:'O',Ô:'O',Ö:'O',Õ:'O',Ō:'O',
  Ú:'U',Ù:'U',Û:'U',Ü:'U',Ū:'U',
  Ý:'Y',Ÿ:'Y',Ñ:'N',Ç:'C',Ś:'S',Ż:'Z',Ź:'Z',Ł:'L'
};

function capitalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeName(input: string): string {
  if (!input) return '';
  return input
    .toUpperCase()
    .split('')
    .map(ch => {
      const code = ch.charCodeAt(0);
      if (LETTER_MAP[ch]) return ch;
      if (FOLD[ch]) return FOLD[ch];
      if (code >= 65 && code <= 90) return ch;
      return '';
    })
    .join('');
}

function sumDigits(n: number): number {
  let s = 0;
  for (const ch of String(n)) s += (ch >= '0' && ch <= '9') ? Number(ch) : 0;
  return s;
}

function isMasterNumber(n: number): boolean {
  return n === 11 || n === 22 || n === 33;
}

/**
 * Modern full-sum reduction: Check for master numbers FIRST, then reduce to single digit.
 */
function reduceNumber(n: number): number {
  if (isMasterNumber(n)) return n;
  
  let total = n;
  while (total > 9 && !isMasterNumber(total)) {
    total = sumDigits(total);
  }
  return total;
}

function makeNumValue(raw: number) {
  const reduced = reduceNumber(raw);
  return { raw, value: reduced, isMaster: isMasterNumber(reduced) };
}

function lettersToSum(name: string, predicate: (ch: string)=>boolean): number {
  const norm = normalizeName(name);
  let sum = 0;
  for (const ch of norm) {
    if (predicate(ch)) sum += LETTER_MAP[ch] || 0;
  }
  return sum;
}

function sumAllLetters(name: string): number {
  return lettersToSum(name, () => true);
}
function sumVowels(name: string): number {
  return lettersToSum(name, ch => VOWELS.has(ch));
}
function sumConsonants(name: string): number {
  return lettersToSum(name, ch => !VOWELS.has(ch));
}

/**
 * Modern full-sum Life Path: day + month + year, then reduce once.
 */
function lifePathFromDOB(dobISO: string) {
  const match = dobISO.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const digits = dobISO.replace(/[^0-9]/g, '');
    const raw = digits.split('').reduce((a, d) => a + Number(d), 0);
    return makeNumValue(raw);
  }
  
  const [, year, month, day] = match;
  const raw = Number(day) + Number(month) + Number(year);
  return makeNumValue(raw);
}

function expressionFromName(name: string) {
  const raw = sumAllLetters(name);
  return makeNumValue(raw);
}

function soulUrgeFromName(name: string) {
  const raw = sumVowels(name);
  return makeNumValue(raw);
}

function personalityFromName(name: string) {
  const raw = sumConsonants(name);
  return makeNumValue(raw);
}

function maturityNumber(expression: any, lifePath: any) {
  const raw = expression.value + lifePath.value;
  return makeNumValue(raw);
}

function computeAll(fullName: string, dobISO: string) {
  const lifePath = lifePathFromDOB(dobISO);
  const expression = expressionFromName(fullName);
  const soulUrge = soulUrgeFromName(fullName);
  const personality = personalityFromName(fullName);
  const maturity = maturityNumber(expression, lifePath);
  return { lifePath, expression, soulUrge, personality, maturity };
}


type Chakra = 'Root' | 'Sacral' | 'Solar Plexus' | 'Heart' | 'Throat' | 'Third Eye' | 'Crown';

const NUM_TO_CHAKRA: Record<number, Chakra> = {
  1:'Root', 8:'Root',
  2:'Sacral', 11:'Sacral',
  3:'Solar Plexus', 9:'Solar Plexus',
  4:'Heart', 6:'Heart',
  5:'Throat',
  7:'Third Eye',
  22:'Crown', 33:'Crown'
};

function mapNum(n: number): Chakra {
  return NUM_TO_CHAKRA[n] ?? 'Root';
}

function mapChakras(nums: any) {
  const mapping = {
    lifePath: mapNum(nums.lifePath.value),
    expression: mapNum(nums.expression.value),
    soulUrge: mapNum(nums.soulUrge.value),
    personality: mapNum(nums.personality.value),
    maturity: mapNum(nums.maturity.value),
  };

  const counts = new Map<Chakra, number>();
  for (const k of Object.values(mapping)) counts.set(k, (counts.get(k) ?? 0) + 1);
  let dominant: Chakra = 'Root', max = -1;
  for (const [ck, n] of counts) if (n > max) { dominant = ck; max = n; }

  const masters = [nums.lifePath, nums.expression, nums.soulUrge, nums.personality, nums.maturity]
    .filter((n: any) => n.isMaster)
    .map((n: any) => mapNum(n.value));
  let bridge: Chakra;
  if (masters.length) {
    bridge = masters.includes('Crown' as Chakra) ? 'Crown' : masters[0];
  } else {
    let second: Chakra = dominant; let secondCount = -1;
    for (const [ck, n] of counts) {
      if (ck === dominant) continue;
      if (n > secondCount) { second = ck; secondCount = n; }
    }
    bridge = second === dominant ? 'Root' : second;
  }

  return { dominant, bridge, mapping };
}

const LABELS: Record<number,string> = {
  1:'Initiator', 2:'Peacemaker', 3:'Creator', 4:'Builder',
  5:'Messenger', 6:'Harmonizer', 7:'Seer', 8:'Executive',
  9:'Humanitarian', 11:'Visionary', 22:'Master Builder', 33:'Master Teacher'
};

function tag(n: number): string {
  return LABELS[n] ? `${n} (${LABELS[n]})` : String(n);
}

function makeFrequencyProfile(nums: any): string {
  const parts = [
    `Life Path ${tag(nums.lifePath.value)}`,
    `Expression ${tag(nums.expression.value)}`,
    `Soul Urge ${tag(nums.soulUrge.value)}`,
    `Personality ${tag(nums.personality.value)}`,
    `Maturity ${tag(nums.maturity.value)}`
  ];
  return parts.join(' · ');
}

function makeAppliedCue(nums: any, chakras: any): string {
  const lp = nums.lifePath.value;
  const ex = nums.expression.value;

  const lead =
    lp === 11 ? 'Lead with your vision and intuition' :
    lp === 6  ? 'Center harmony and service' :
    lp === 8  ? 'Own the decision and the numbers' :
    lp === 7  ? 'Take 30 minutes for research before moving' :
    lp === 5  ? 'Share a message publicly today' :
    'Take one decisive step';

  const build =
    ex === 22 ? 'translate the idea into a simple system (3 steps, 1 owner, 24h)' :
    ex === 8  ? 'codify it into a concrete plan with budget + timeline' :
    ex === 4  ? 'lay a checklist and ship v1' :
    ex === 3  ? 'shape it into a story or demo' :
    'write a one-pager and act on the first bullet';

  return `${lead}, then ${build}. Energy: Dominant ${chakras.dominant}, Bridge ${chakras.bridge}.`;
}

// Descriptions
const lifePathDescriptions: Record<number, string> = {
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

const expressionDescriptions: Record<number, string> = {
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

const soulUrgeDescriptions: Record<number, string> = {
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

const personalityDescriptions: Record<number, string> = {
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

const maturityDescriptions: Record<number, string> = {
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

const chakraDescriptions: Record<string, string> = {
  'Root': "Grounded stability, survival, and physical manifestation",
  'Sacral': "Creative flow, emotional depth, and sensual expression",
  'Solar Plexus': "Personal power, willpower, and confident action",
  'Heart': "Compassion, love, and harmonious connection",
  'Throat': "Communication, truth, and authentic expression",
  'Third Eye': "Intuition, vision, and spiritual insight",
  'Crown': "Universal consciousness, enlightenment, and divine connection"
};

function makeDetailedSummary(fullName: string, dob: string, nums: any, chakras: any): string {
  const chakraFlow = [
    chakras.mapping.lifePath,
    chakras.mapping.expression,
    chakras.mapping.soulUrge,
    chakras.mapping.personality,
    chakras.mapping.maturity
  ].filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i);

  const lp = nums.lifePath.value;
  const ex = nums.expression.value;
  const su = nums.soulUrge.value;
  
  let synthesis = '';
  
  if (lp === 11) {
    synthesis += 'Your spiritual vision illuminates the path forward. ';
  } else if (lp === 22) {
    synthesis += 'You are here to build systems that transform the world. ';
  } else if (lp === 6) {
    synthesis += 'You create harmony and beauty wherever you go. ';
  } else if (lp === 8) {
    synthesis += 'You master material reality and organize resources with power. ';
  } else if (lp === 1) {
    synthesis += 'You pioneer new paths with courage and independence. ';
  } else {
    synthesis += `Your ${LABELS[lp] || 'unique'} path shapes your journey. `;
  }
  
  if (ex === 22) {
    synthesis += 'Express this through master-building—create tangible systems with clear structure and timeline. ';
  } else if (ex === 8) {
    synthesis += 'Express this through executive action—codify plans with budget, metrics, and accountability. ';
  } else if (ex === 3) {
    synthesis += 'Express this through creative storytelling—shape your vision into compelling narrative. ';
  } else if (ex === 4) {
    synthesis += 'Express this through methodical building—create checklists and ship incrementally. ';
  } else {
    synthesis += `Your ${LABELS[ex] || 'expression'} nature channels this energy outward. `;
  }
  
  if (su === 11 || su === 22 || su === 33) {
    synthesis += `Your soul's master calling (${su}) demands you serve a higher purpose beyond personal gain. `;
  } else if (su === 8) {
    synthesis += 'Deep within, you crave abundance and recognition—honor this while serving others. ';
  } else if (su === 6) {
    synthesis += 'Your heart seeks to nurture and create beauty—this is your true compass. ';
  }
  
  synthesis += `\n\nYour energy centers anchor in ${chakras.dominant} (${(chakraDescriptions[chakras.dominant] || '').toLowerCase()}), `;
  synthesis += `with ${chakras.bridge} acting as your bridge to higher consciousness. `;
  synthesis += `Work consciously with these centers to align action with essence.`;

  return `✨ ${fullName}
Born ${dob}

CORE NUMBERS

Life Path ${nums.lifePath.value}${nums.lifePath.isMaster ? ' (Master)' : ''}: ${lifePathDescriptions[nums.lifePath.value] || 'A unique path of discovery.'}

Expression ${nums.expression.value}${nums.expression.isMaster ? ' (Master)' : ''}: ${expressionDescriptions[nums.expression.value] || 'A distinctive expression.'}

Soul Urge ${nums.soulUrge.value}${nums.soulUrge.isMaster ? ' (Master)' : ''}: ${soulUrgeDescriptions[nums.soulUrge.value] || 'A deep inner calling.'}

Personality ${nums.personality.value}${nums.personality.isMaster ? ' (Master)' : ''}: ${personalityDescriptions[nums.personality.value] || 'A unique presence.'}

Maturity ${nums.maturity.value}${nums.maturity.isMaster ? ' (Master)' : ''}: ${maturityDescriptions[nums.maturity.value] || 'A path of growth.'}

ENERGY CENTERS

Dominant Chakra: ${chakras.dominant} – ${chakraDescriptions[chakras.dominant] || ''}
Bridge Chakra: ${chakras.bridge} – ${chakraDescriptions[chakras.bridge] || ''}
Chakra Flow: ${chakraFlow.join(' → ')}

INTEGRATED READING

${synthesis}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, dob } = await req.json();

    if (!fullName || !dob) {
      return new Response(
        JSON.stringify({ error: 'fullName and dob are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lifePath = lifePathFromDOB(dob);
    const expression = expressionFromName(fullName);
    const soulUrge = soulUrgeFromName(fullName);
    const personality = personalityFromName(fullName);
    const maturity = maturityNumber(expression, lifePath);

    const numbers = { lifePath, expression, soulUrge, personality, maturity };
    const chakras = mapChakras(numbers);
    const frequencyProfile = makeFrequencyProfile(numbers);
    const energyField = `Dominant: ${chakras.dominant} · Bridge: ${chakras.bridge}`;
    const insight = makeAppliedCue(numbers, chakras);
    const capitalizedName = capitalizeName(fullName);
    const detailedSummary = makeDetailedSummary(capitalizedName, dob, numbers, chakras);

    const result = {
      input: { fullName: capitalizedName, dob },
      numbers,
      chakras,
      reading: { frequencyProfile, energyField, insight, detailedSummary }
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
