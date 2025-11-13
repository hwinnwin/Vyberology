/**
 * Five-Number Oracle Reading Edge Function
 *
 * Generates oracle readings from 5 numbers with pattern synthesis.
 * Supports streaming for real-time delivery.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";
import { buildCors, passesRateLimit } from "../_shared/security.ts";
import { ServerTimer } from "../_lib/serverTiming.ts";
import { createLogger, extractRequestContext } from "../_shared/errorLogger.ts";

// Import oracle engine (we'll need to bundle this)
// For now, we'll implement the logic inline or via a bundled module

type CaptureMethod = 'time' | 'manual' | 'image' | 'pattern' | 'comment' | 'live' | 'random';
type SessionType = 'async' | 'live' | 'story' | 'instant';
type ReadingTier = 'free' | 'basic' | 'premium' | 'team';

interface OracleReadingRequest {
  numbers: number[];                    // Exactly 5 numbers (1-99)
  captureTimestamps?: string[];         // ISO timestamps
  captureMethods?: CaptureMethod[];
  sessionId?: string;
  sessionType?: SessionType;
  tier?: ReadingTier;
  userId?: string;
  saveToHistory?: boolean;              // Save to database
}

interface OracleReadingResponse {
  success: boolean;
  reading?: {
    id?: string;
    numbers: number[];
    coreFrequencies: number[];
    meanings: Array<{
      number: number;
      meaning: string;
      action: string;
      element: string;
      chakra: string;
      keywords: string[];
    }>;
    pattern: {
      type: string;
      description: string;
      strength: number;
      dominantElement: string;
      dominantChakra: string;
      synthesis: string;
      actionSequence: string[];
    };
    title: string;
    synthesis: string;
    essenceSentence: string;
    cta: string;
    markdown: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

const corsHeaders = buildCors();

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const timer = new ServerTimer();
  const context = extractRequestContext(req);
  const logger = createLogger("oracle-reading", context);

  try {
    // Check rate limit
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const allowed = await passesRateLimit(clientIp, {
      maxRequests: 30,
      windowSec: 60,
    });

    if (!allowed) {
      logger.warn("Rate limit exceeded", { clientIp });
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "RATE_LIMIT", message: "Too many requests" },
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request
    const body = await req.json() as OracleReadingRequest;

    // Validate request
    const validationError = validateRequest(body);
    if (validationError) {
      logger.warn("Invalid request", { error: validationError, body });
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationError },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    timer.mark("validation");

    // Generate oracle reading
    const reading = await generateOracleReading(body);
    timer.mark("generation");

    // Save to database if requested and user authenticated
    if (body.saveToHistory && body.userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await saveOracleReading(supabase, body, reading);
      timer.mark("database");
    }

    const response: OracleReadingResponse = {
      success: true,
      reading,
    };

    logger.info("Oracle reading generated", {
      pattern: reading.pattern.type,
      strength: reading.pattern.strength,
      tier: body.tier || 'free',
      timing: timer.getSummary(),
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Server-Timing": timer.getHeader(),
      },
    });
  } catch (error) {
    logger.error("Oracle reading error", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate oracle reading",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Validate oracle reading request
 */
function validateRequest(body: OracleReadingRequest): string | null {
  if (!body.numbers || !Array.isArray(body.numbers)) {
    return "Numbers array is required";
  }

  if (body.numbers.length !== 5) {
    return "Exactly 5 numbers are required";
  }

  for (const num of body.numbers) {
    if (!Number.isInteger(num) || num < 1 || num > 99) {
      return `Invalid number: ${num}. Must be integer between 1-99`;
    }
  }

  if (body.captureTimestamps && body.captureTimestamps.length !== 5) {
    return "captureTimestamps must have exactly 5 entries";
  }

  if (body.captureMethods && body.captureMethods.length !== 5) {
    return "captureMethods must have exactly 5 entries";
  }

  return null;
}

/**
 * Generate oracle reading (inline implementation)
 * In production, this would import from @vybe/reading-engine
 */
async function generateOracleReading(request: OracleReadingRequest) {
  // For now, we'll use a simplified inline implementation
  // In production, this should use the reading-engine package

  const { numbers, tier = 'free' } = request;

  // Import oracle meaning bank (simplified for Edge Function)
  const meanings = numbers.map(n => getOracleMeaning(n));

  // Calculate core frequencies
  const coreFrequencies = numbers.map(n => reduceNumber(n));

  // Analyze pattern
  const pattern = analyzePattern(meanings);

  // Generate title
  const title = `Your ${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Oracle`;

  // Generate synthesis
  const synthesis = pattern.synthesis;

  // Generate essence sentence
  const essenceSentence = generateEssenceSentence(meanings, pattern.type);

  // Generate CTA
  const cta = getCTA(pattern.type);

  // Generate markdown
  const markdown = formatMarkdown({
    title,
    numbers,
    meanings,
    pattern,
    synthesis,
    essenceSentence,
    cta
  });

  return {
    numbers,
    coreFrequencies,
    meanings,
    pattern,
    title,
    synthesis,
    essenceSentence,
    cta,
    markdown
  };
}

/**
 * Save oracle reading to database
 */
async function saveOracleReading(
  supabase: any,
  request: OracleReadingRequest,
  reading: any
) {
  const { data, error } = await supabase.from("oracle_readings").insert({
    user_id: request.userId,
    numbers: request.numbers,
    capture_timestamps: request.captureTimestamps,
    capture_methods: request.captureMethods,
    core_frequencies: reading.coreFrequencies,
    dominant_frequency: reading.pattern.dominantElement, // TODO: map properly
    harmonic_pattern: reading.pattern.type,
    pattern_strength: reading.pattern.strength,
    reading_data: {
      title: reading.title,
      numbers: reading.meanings,
      synthesis: reading.synthesis,
      pattern: reading.pattern,
      cta: reading.cta,
      essenceSentence: reading.essenceSentence
    },
    session_id: request.sessionId,
    session_type: request.sessionType,
    reading_tier: request.tier || 'free',
    data_consent_given: false,
    anonymized: true
  });

  if (error) {
    console.error("Failed to save oracle reading:", error);
  }

  return data;
}

/**
 * Utility functions (simplified versions)
 * In production, these would come from @vybe/reading-engine
 */

function reduceNumber(n: number): number {
  let total = n;
  while (total > 9) {
    if ([11, 22, 33, 44].includes(total)) return total;
    const next = String(total).split('').reduce((sum, d) => sum + Number(d), 0);
    if (next === total) break;
    total = next;
  }
  return total;
}

function getOracleMeaning(number: number) {
  // Simplified meaning bank - in production, import full bank
  const basicMeanings: Record<number, any> = {
    1: { number: 1, meaning: 'Start / Spark / Declare', action: 'Begin now', element: 'Fire', chakra: 'Root', keywords: ['initiation', 'independence'] },
    2: { number: 2, meaning: 'Partner / Choose harmony', action: 'Seek support', element: 'Water', chakra: 'Sacral', keywords: ['partnership', 'balance'] },
    3: { number: 3, meaning: 'Express / Ship draft one', action: 'Create visibly', element: 'Air', chakra: 'Solar Plexus', keywords: ['creativity', 'expression'] },
    4: { number: 4, meaning: 'Structure / Set the rule', action: 'Build foundation', element: 'Earth', chakra: 'Root', keywords: ['stability', 'discipline'] },
    5: { number: 5, meaning: 'Pivot / Test new path', action: 'Experiment freely', element: 'Air', chakra: 'Throat', keywords: ['change', 'freedom'] },
    6: { number: 6, meaning: 'Nurture / Protect asset', action: 'Care deeply', element: 'Earth', chakra: 'Heart', keywords: ['harmony', 'service'] },
    7: { number: 7, meaning: 'Reflect / Data over drama', action: 'Analyze quietly', element: 'Water', chakra: 'Third Eye', keywords: ['wisdom', 'introspection'] },
    8: { number: 8, meaning: 'Power / Price properly', action: 'Own your value', element: 'Earth', chakra: 'Solar Plexus', keywords: ['abundance', 'authority'] },
    9: { number: 9, meaning: 'Complete / Release backlog', action: 'Let go fully', element: 'Fire', chakra: 'Crown', keywords: ['completion', 'wisdom'] },
    11: { number: 11, meaning: 'Signal / Trust the antenna', action: 'Follow intuition', element: 'Air', chakra: 'Third Eye', keywords: ['illumination', 'intuition'] },
    22: { number: 22, meaning: 'Foundation++ / Build platform', action: 'Systemize the win', element: 'Earth', chakra: 'Crown', keywords: ['master builder', 'vision'] },
    33: { number: 33, meaning: 'Amplify / Teach what you do', action: 'Share expertise', element: 'Air', chakra: 'Throat', keywords: ['master teacher', 'compassion'] },
  };

  // Generate meaning for numbers not in basic set
  const reduced = reduceNumber(number);
  const base = basicMeanings[reduced] || basicMeanings[1];

  return basicMeanings[number] || {
    ...base,
    number,
    meaning: `${base.meaning} (${number})`,
  };
}

function analyzePattern(meanings: any[]) {
  const elements = meanings.map(m => m.element);
  const chakras = meanings.map(m => m.chakra);

  // Simplified pattern detection
  let type = 'balanced';
  const elementCounts = countOccurrences(elements);
  const maxElementCount = Math.max(...Object.values(elementCounts));

  if (maxElementCount >= 3) type = 'focused';

  // Calculate strength
  const strength = maxElementCount / 5;

  const dominantElement = Object.entries(elementCounts)
    .reduce((a, b) => b[1] > a[1] ? b : a)[0];

  const chakraCounts = countOccurrences(chakras);
  const dominantChakra = Object.entries(chakraCounts)
    .reduce((a, b) => b[1] > a[1] ? b : a)[0];

  const description = `${type.charAt(0).toUpperCase() + type.slice(1)} pattern with ${dominantElement} energy`;

  const synthesis = `This is a ${type} pull. ${dominantElement} energy, ${dominantChakra} resonance. ${meanings.map(m => m.keywords[0]).join(', ')}.`;

  const actionSequence = meanings.map(m => m.action);

  return {
    type,
    description,
    strength,
    dominantElement,
    dominantChakra,
    synthesis,
    actionSequence
  };
}

function countOccurrences(arr: string[]): Record<string, number> {
  return arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function generateEssenceSentence(meanings: any[], patternType: string): string {
  const actions = meanings.map(m => m.action.toLowerCase());
  const first = actions[0];
  const last = actions[4];

  return `${first.charAt(0).toUpperCase() + first.slice(1)}, integrate, then ${last}.`;
}

function getCTA(patternType: string): string {
  const ctas: Record<string, string> = {
    build: 'Comment BUILDER for your foundation guide',
    release: 'Comment RELEASE for your completion ritual',
    amplify: 'Comment AMPLIFY for your broadcast checklist',
    balanced: 'Comment BALANCE for your integration guide',
    focused: 'Comment FOCUS for your single-frequency guide'
  };

  return ctas[patternType] || 'Comment ORACLE for your guide';
}

function formatMarkdown(data: any): string {
  let md = `# 🔮 ${data.title}\n\n`;

  md += `## Your Five Numbers\n\n`;
  data.meanings.forEach((m: any, i: number) => {
    md += `**${i + 1}. ${m.number}** — ${m.meaning}\n`;
    md += `   _${m.action}_ • ${m.element} • ${m.chakra}\n\n`;
  });

  md += `---\n\n`;
  md += `## Pattern: ${data.pattern.description}\n\n`;
  md += `**Strength**: ${(data.pattern.strength * 100).toFixed(0)}%\n\n`;

  md += `---\n\n`;
  md += `## ✨ Synthesis\n\n`;
  md += `${data.synthesis}\n\n`;

  md += `## 🎯 Action Sequence\n\n`;
  data.pattern.actionSequence.forEach((action: string, i: number) => {
    md += `${i + 1}. ${action}\n`;
  });

  md += `\n---\n\n`;
  md += `### ✴️ Essence\n\n`;
  md += `_${data.essenceSentence}_\n\n`;

  md += `---\n\n`;
  md += `**${data.cta}**\n`;

  return md;
}
