const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;
const MAX_MESSAGE_CHARS = 16000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://vyberology.com,http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const rateLimitWindowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60_000);
const rateLimitMax = Number(process.env.AI_RATE_LIMIT_MAX || 10);

const rateLimitStore = globalThis.__VYBER_RATE_LIMIT__ || new Map();
// eslint-disable-next-line no-underscore-dangle
globalThis.__VYBER_RATE_LIMIT__ = rateLimitStore;

function getClientIp(event) {
  const forwardedFor = event.headers["x-forwarded-for"] || "";
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return event.headers["client-ip"] || "unknown";
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  return allowedOrigins.some((allowed) => {
    if (allowed.includes("*")) {
      const regex = new RegExp(`^${allowed.replace(/\*/g, ".*")}$`);
      return regex.test(origin);
    }
    return allowed === origin;
  });
}

function getCorsHeaders(origin) {
  const allowed = isOriginAllowed(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin || "https://vyberology.com" : "null",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function shouldRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }
  if (entry.count >= rateLimitMax) {
    return true;
  }
  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return false;
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((msg) => msg && msg.role)
    .map((msg) => {
      // Handle both string content and array content (for tool_use/tool_result)
      let content = msg.content;
      if (typeof content === "string") {
        content = content.slice(0, MAX_MESSAGE_CHARS);
      } else if (Array.isArray(content)) {
        // Content blocks for tool_use or tool_result - pass through
        content = content.map((block) => {
          if (block.type === "text" && typeof block.text === "string") {
            return { ...block, text: block.text.slice(0, MAX_MESSAGE_CHARS) };
          }
          if (block.type === "tool_result" && typeof block.content === "string") {
            return { ...block, content: block.content.slice(0, MAX_MESSAGE_CHARS) };
          }
          return block;
        });
      }
      return {
        role: msg.role === "assistant" ? "assistant" : "user",
        content,
      };
    });
}

exports.handler = async (event) => {
  const origin = event.headers.origin;
  const corsHeaders = getCorsHeaders(origin);

  if (!isOriginAllowed(origin)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, Allow: "POST" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing server API key" }),
    };
  }

  const clientIp = getClientIp(event);
  if (shouldRateLimit(clientIp)) {
    return {
      statusCode: 429,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Rate limit exceeded" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const messages = sanitizeMessages(payload.messages);
  if (messages.length === 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "No messages provided" }),
    };
  }

  const body = {
    model: typeof payload.model === "string" ? payload.model : DEFAULT_MODEL,
    max_tokens:
      typeof payload.max_tokens === "number"
        ? Math.min(payload.max_tokens, MAX_TOKENS)
        : 1024,
    system: typeof payload.system === "string" ? payload.system : undefined,
    messages,
  };

  // Add tools if provided (for agent mode)
  if (Array.isArray(payload.tools) && payload.tools.length > 0) {
    body.tools = payload.tools;
  }

  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Upstream request failed" }),
    };
  }

  const responseText = await response.text();

  return {
    statusCode: response.status,
    headers: {
      ...corsHeaders,
      "content-type": response.headers.get("content-type") || "application/json",
    },
    body: responseText,
  };
};
