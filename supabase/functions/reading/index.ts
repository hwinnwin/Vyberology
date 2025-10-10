import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Numerology engine
const NUMEROLOGY_MAP: Record<string, any> = {
  '0': {
    headline: 'Divine Zero',
    keywords: ['infinite potential', 'reset', 'source', 'void', 'beginning'],
    guidance: 'You stand at the threshold of infinite possibility. The zero represents the cosmic womb from which all creation emerges.'
  },
  '1': {
    headline: 'The Initiator',
    keywords: ['new beginning', 'leadership', 'independence', 'confidence'],
    guidance: 'You are being called to step forward and lead. This is your moment to initiate and create.'
  },
  '2': {
    headline: 'The Harmonizer',
    keywords: ['balance', 'cooperation', 'partnership', 'diplomacy'],
    guidance: 'Seek harmony and balance. Partnerships and collaboration will bring success.'
  },
  '3': {
    headline: 'The Creator',
    keywords: ['joy', 'expression', 'creativity', 'communication'],
    guidance: 'Express yourself freely. Your creative energy is flowing and wants to be shared.'
  },
  '4': {
    headline: 'The Builder',
    keywords: ['structure', 'foundation', 'stability', 'discipline'],
    guidance: 'Build solid foundations. Focus on practical matters and creating lasting structures.'
  },
  '5': {
    headline: 'Freedom Seeker',
    keywords: ['change', 'adapt', 'freedom', 'adventure'],
    guidance: 'Embrace change and new experiences. Freedom comes through adaptability.'
  },
  '6': {
    headline: 'The Nurturer',
    keywords: ['care', 'harmony', 'responsibility', 'service'],
    guidance: 'Care for yourself and others. Create harmony in your relationships and environment.'
  },
  '7': {
    headline: 'The Seeker',
    keywords: ['wisdom', 'spirit', 'introspection', 'truth'],
    guidance: 'Seek deeper understanding. Trust your inner wisdom and spiritual insights.'
  },
  '8': {
    headline: 'The Powerhouse',
    keywords: ['abundance', 'authority', 'power', 'manifestation'],
    guidance: 'Step into your power. Abundance and success are within your reach.'
  },
  '9': {
    headline: 'The Humanitarian',
    keywords: ['completion', 'legacy', 'wisdom', 'service'],
    guidance: 'A cycle is completing. Share your wisdom and create a lasting legacy.'
  },
  '11': {
    headline: 'The Visionary',
    keywords: ['intuition', 'downloads', 'spiritual insight', 'illumination'],
    guidance: 'You are receiving divine downloads. Trust your heightened intuition and inner visions.'
  },
  '22': {
    headline: 'The Master Builder',
    keywords: ['architecture', 'legacy', 'manifestation', 'grand vision'],
    guidance: 'You have the power to build something lasting and significant. Think big and act strategically.'
  },
  '33': {
    headline: 'The Master Teacher',
    keywords: ['love', 'healing', 'compassion', 'guidance'],
    guidance: 'You are here to heal and teach through unconditional love. Share your gifts with the world.'
  },
  '44': {
    headline: 'The Master Organizer',
    keywords: ['systems', 'empire', 'discipline', 'mastery'],
    guidance: 'Build powerful systems and structures. Your organizational mastery can create an empire.'
  }
};

const CHAKRA_MAP: Record<string, any> = {
  '1': {
    name: 'Root Chakra',
    element: 'Earth',
    focus: 'grounding, survival, security',
    color: 'red'
  },
  '2': {
    name: 'Sacral Chakra',
    element: 'Water',
    focus: 'creativity, emotion, sensuality',
    color: 'orange'
  },
  '3': {
    name: 'Solar Plexus Chakra',
    element: 'Fire',
    focus: 'power, confidence, action',
    color: 'yellow'
  },
  '4': {
    name: 'Heart Chakra',
    element: 'Air',
    focus: 'love, compassion, connection',
    color: 'green'
  },
  '5': {
    name: 'Throat Chakra',
    element: 'Sound',
    focus: 'communication, truth, expression',
    color: 'blue'
  },
  '6': {
    name: 'Third Eye Chakra',
    element: 'Light',
    focus: 'intuition, vision, insight',
    color: 'indigo'
  },
  '7': {
    name: 'Crown Chakra',
    element: 'Thought',
    focus: 'consciousness, unity, enlightenment',
    color: 'violet'
  },
  '8': {
    name: 'Earth Star Chakra',
    element: 'Earth',
    focus: 'connection to Earth, ancestors, lineage',
    color: 'brown'
  },
  '9': {
    name: 'Soul Star Chakra',
    element: 'Spirit',
    focus: 'divine purpose, cosmic connection, higher self',
    color: 'white'
  }
};

function normalizeNumber(input: string): string {
  // Strip all non-digits except : and %
  const cleaned = input.replace(/[^\d:%]/g, '');
  
  // Extract just the digits for reduction
  const digits = cleaned.replace(/[:%]/g, '');
  
  if (!digits) return '0';
  
  return reduceToCore(digits);
}

function reduceToCore(numStr: string): string {
  let num = parseInt(numStr);
  
  // Check for master numbers at each step
  const masterNumbers = [11, 22, 33, 44];
  
  while (num > 9 && !masterNumbers.includes(num)) {
    num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  
  return num.toString();
}

function getNumerologyMeaning(number: string) {
  return NUMEROLOGY_MAP[number] || NUMEROLOGY_MAP['0'];
}

function getChakraMeaning(number: string) {
  // Master numbers have amplified chakra meanings
  if (number === '11') return { ...CHAKRA_MAP['7'], amplified: true, message: 'Crown chakra amplified - heightened spiritual connection' };
  if (number === '22') return { ...CHAKRA_MAP['1'], amplified: true, message: 'Root chakra amplified - master manifestation energy' };
  if (number === '33') return { ...CHAKRA_MAP['4'], amplified: true, message: 'Heart chakra amplified - master healing energy' };
  if (number === '44') return { ...CHAKRA_MAP['8'], amplified: true, message: 'Earth Star amplified - master grounding energy' };
  
  return CHAKRA_MAP[number] || CHAKRA_MAP['1'];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { input_text, context, tags } = await req.json();

    if (!input_text) {
      return new Response(
        JSON.stringify({ error: 'input_text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the reading
    const normalized_number = normalizeNumber(input_text);
    const numerology = getNumerologyMeaning(normalized_number);
    const chakra = getChakraMeaning(normalized_number);

    const reading = {
      input_text,
      normalized_number,
      numerology_data: numerology,
      chakra_data: chakra,
    };

    return new Response(
      JSON.stringify(reading),
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
