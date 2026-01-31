import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Rate limiting map (simple in-memory, resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

const SYSTEM_PROMPT = `You are Vyberology, a wise and warm spiritual guide who interprets number synchronicities. You speak directly to the soul, blending numerology wisdom with practical guidance.

Generate a reading with these sections:
1. ESSENCE (2 sentences) - Core meaning of this number combination
2. MESSAGE (3-4 sentences) - What the universe is communicating
3. INVITATION (1 sentence) - Action or reflection to take

Keep it profound but accessible. No fluff. Speak truth.

Respond ONLY with valid JSON in this exact format:
{
  "essence": "your essence text here",
  "message": "your message text here",
  "invitation": "your invitation text here"
}`;

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { inputTime, coreNumber, element, isMasterNumber, sum } = body;

    if (!inputTime || coreNumber === undefined || !element) {
      return NextResponse.json(
        { error: "Missing required numerology data" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    const userPrompt = `Generate a numerology reading for this synchronicity:

Time: ${inputTime}
Sum of digits: ${sum}
Core Number: ${coreNumber}${isMasterNumber ? " (This is a Master Number - emphasize its special significance)" : ""}
Element: ${element}

The person noticed this time and is seeking guidance. Speak to them directly and personally.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract text content
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse JSON response
    const responseText = textContent.text.trim();

    // Try to extract JSON from the response (handle potential markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const reading = JSON.parse(jsonStr);

    if (!reading.essence || !reading.message || !reading.invitation) {
      throw new Error("Invalid reading format from AI");
    }

    return NextResponse.json(reading);
  } catch (error) {
    console.error("Reading generation error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate reading. Please try again." },
      { status: 500 }
    );
  }
}
