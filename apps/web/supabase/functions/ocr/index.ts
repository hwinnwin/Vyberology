import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Numerology engine
const NUMEROLOGY_MAP: Record<string, any> = {
  '0': { headline: 'Divine Zero', keywords: ['infinite potential', 'reset', 'source'], guidance: 'You stand at the threshold of infinite possibility.' },
  '1': { headline: 'The Initiator', keywords: ['new beginning', 'leadership', 'independence'], guidance: 'You are being called to step forward and lead.' },
  '2': { headline: 'The Harmonizer', keywords: ['balance', 'cooperation', 'partnership'], guidance: 'Seek harmony and balance.' },
  '3': { headline: 'The Creator', keywords: ['joy', 'expression', 'creativity'], guidance: 'Express yourself freely.' },
  '4': { headline: 'The Builder', keywords: ['structure', 'foundation', 'stability'], guidance: 'Build solid foundations.' },
  '5': { headline: 'Freedom Seeker', keywords: ['change', 'adapt', 'freedom'], guidance: 'Embrace change and new experiences.' },
  '6': { headline: 'The Nurturer', keywords: ['care', 'harmony', 'responsibility'], guidance: 'Care for yourself and others.' },
  '7': { headline: 'The Seeker', keywords: ['wisdom', 'spirit', 'introspection'], guidance: 'Seek deeper understanding.' },
  '8': { headline: 'The Powerhouse', keywords: ['abundance', 'authority', 'power'], guidance: 'Step into your power.' },
  '9': { headline: 'The Humanitarian', keywords: ['completion', 'legacy', 'wisdom'], guidance: 'A cycle is completing.' },
  '11': { headline: 'The Visionary', keywords: ['intuition', 'downloads', 'spiritual insight'], guidance: 'You are receiving divine downloads.' },
  '22': { headline: 'The Master Builder', keywords: ['architecture', 'legacy', 'manifestation'], guidance: 'You have the power to build something lasting.' },
  '33': { headline: 'The Master Teacher', keywords: ['love', 'healing', 'compassion'], guidance: 'You are here to heal and teach through love.' },
  '44': { headline: 'The Master Organizer', keywords: ['systems', 'empire', 'discipline'], guidance: 'Build powerful systems and structures.' }
};

const CHAKRA_MAP: Record<string, any> = {
  '1': { name: 'Root Chakra', element: 'Earth', focus: 'grounding, survival, security', color: 'red' },
  '2': { name: 'Sacral Chakra', element: 'Water', focus: 'creativity, emotion, sensuality', color: 'orange' },
  '3': { name: 'Solar Plexus Chakra', element: 'Fire', focus: 'power, confidence, action', color: 'yellow' },
  '4': { name: 'Heart Chakra', element: 'Air', focus: 'love, compassion, connection', color: 'green' },
  '5': { name: 'Throat Chakra', element: 'Sound', focus: 'communication, truth, expression', color: 'blue' },
  '6': { name: 'Third Eye Chakra', element: 'Light', focus: 'intuition, vision, insight', color: 'indigo' },
  '7': { name: 'Crown Chakra', element: 'Thought', focus: 'consciousness, unity, enlightenment', color: 'violet' },
  '8': { name: 'Earth Star Chakra', element: 'Earth', focus: 'connection to Earth, ancestors', color: 'brown' },
  '9': { name: 'Soul Star Chakra', element: 'Spirit', focus: 'divine purpose, cosmic connection', color: 'white' }
};

function normalizeNumber(input: string): string {
  const cleaned = input.replace(/[^\d:%]/g, '');
  const digits = cleaned.replace(/[:%]/g, '');
  if (!digits) return '0';
  return reduceToCore(digits);
}

function reduceToCore(numStr: string): string {
  let num = parseInt(numStr);
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
  if (number === '11') return { ...CHAKRA_MAP['7'], amplified: true, message: 'Crown chakra amplified' };
  if (number === '22') return { ...CHAKRA_MAP['1'], amplified: true, message: 'Root chakra amplified' };
  if (number === '33') return { ...CHAKRA_MAP['4'], amplified: true, message: 'Heart chakra amplified' };
  if (number === '44') return { ...CHAKRA_MAP['8'], amplified: true, message: 'Earth Star amplified' };
  return CHAKRA_MAP[number] || CHAKRA_MAP['1'];
}

function extractNumbers(text: string): string[] {
  const patterns = [
    /\b\d+:\d+(?::\d+)?\b/g,  // Times
    /\b\d+%\b/g,               // Percentages
    /\b\d+\b/g,                // Numbers
  ];
  const numbers: Set<string> = new Set();
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) matches.forEach(match => numbers.add(match));
  }
  return Array.from(numbers);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('OCR function called');
    const formData = await req.formData();
    const file = formData.get('screenshot') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'screenshot file is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File received:', file.size, 'bytes, type:', file.type);

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Image too large', message: 'Please use an image smaller than 20MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    console.log('ArrayBuffer size:', bytes.byteLength);

    // For very large images, this can fail
    try {
      const uint8Array = new Uint8Array(bytes);
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
      const mimeType = file.type || 'image/jpeg';
      console.log('Base64 encoded, length:', base64.length);
    } catch (e) {
      console.error('Base64 encoding failed:', e);
      return new Response(
        JSON.stringify({ error: 'Image encoding failed', message: 'Try a smaller image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uint8Array = new Uint8Array(bytes);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
    const mimeType = file.type || 'image/jpeg';

    // Call OpenAI Vision
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling OpenAI Vision API...');
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ALL numbers from this image. Include times (11:11), percentages (75%), repeating numbers (222), phone numbers, license plates, prices, etc. Return just the numbers you see, one per line.'
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` }
            }
          ]
        }],
        max_tokens: 500
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI error:', aiResponse.status, errorText);

      // Return detailed error to user for debugging
      return new Response(
        JSON.stringify({
          error: 'OpenAI API Error',
          status: aiResponse.status,
          details: errorText,
          message: `OpenAI returned ${aiResponse.status}. Check your API key and credits.`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const raw_text = aiData.choices[0]?.message?.content || '';
    console.log('Extracted text:', raw_text);

    // Extract and process numbers
    const numbers = extractNumbers(raw_text);
    console.log('Found numbers:', numbers);

    const readings = [];
    for (const numText of numbers) {
      const normalized_number = normalizeNumber(numText);
      const numerology = getNumerologyMeaning(normalized_number);
      const chakra = getChakraMeaning(normalized_number);

      readings.push({
        input_text: numText,
        normalized_number,
        numerology_data: numerology,
        chakra_data: chakra,
        context: 'Extracted from image',
        tags: ['ocr', 'screenshot'],
      });
    }

    console.log('Returning', readings.length, 'readings');

    return new Response(
      JSON.stringify({ raw_text, numbers, readings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OCR error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
