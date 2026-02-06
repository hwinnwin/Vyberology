import type { Handler } from "@netlify/functions";

const BRAVE_SEARCH_API = "https://api.search.brave.com/res/v1/web/search";

// Rate limiting for search
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // More generous for search
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function getAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS || "";
  return origins.split(",").map(o => o.trim()).filter(Boolean);
}

function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  const allowOrigin = allowedOrigins.length === 0 || (origin && allowedOrigins.includes(origin))
    ? origin || "*"
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

export const handler: Handler = async (event) => {
  const origin = event.headers.origin;
  const headers = getCorsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Rate limiting
  const clientIp = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: "Search rate limit exceeded. Please try again later." }),
    };
  }

  const braveKey = process.env.BRAVE_SEARCH_API_KEY;

  try {
    const body = JSON.parse(event.body || "{}");
    const query = body.query?.slice(0, 500); // Limit query length

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Query required" }),
      };
    }

    // Try Brave Search if key exists
    if (braveKey) {
      const searchUrl = `${BRAVE_SEARCH_API}?q=${encodeURIComponent(query)}&count=10`;
      const response = await fetch(searchUrl, {
        headers: {
          "X-Subscription-Token": braveKey,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.web?.results?.map((r: { title: string; url: string; description: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        })) || [];

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ results, source: "brave" }),
        };
      }
    }

    // Fallback: Use DuckDuckGo instant answers (no API key needed)
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const ddgResponse = await fetch(ddgUrl);

    if (ddgResponse.ok) {
      const ddgData = await ddgResponse.json();
      const results = [];

      if (ddgData.Abstract) {
        results.push({
          title: ddgData.Heading || query,
          url: ddgData.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: ddgData.Abstract,
        });
      }

      if (ddgData.RelatedTopics) {
        for (const topic of ddgData.RelatedTopics.slice(0, 5)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 50),
              url: topic.FirstURL,
              snippet: topic.Text,
            });
          }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ results, source: "duckduckgo" }),
      };
    }

    // Last fallback: Return search link
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results: [{
          title: `Search results for "${query}"`,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          snippet: "Click to search on Google",
        }],
        source: "fallback",
      }),
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Search failed",
      }),
    };
  }
};
