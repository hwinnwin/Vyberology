/**
 * VybeR Agent API Endpoint
 *
 * Allows external services to use VybeR as a browsing agent.
 * This endpoint handles server-side web scraping tasks.
 *
 * POST /api/agent
 * {
 *   "task": "Search for flights to Tokyo",
 *   "api_key": "optional-override-key"
 * }
 *
 * Returns:
 * {
 *   "success": true,
 *   "summary": "Found 5 flight options...",
 *   "data": { ... }
 * }
 */

const AGENT_TOOLS = [
  {
    name: "web_search",
    description: "Search the web using a search engine",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" }
      },
      required: ["query"]
    }
  },
  {
    name: "fetch_page",
    description: "Fetch a web page and extract its content",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to fetch" },
        extract: {
          type: "string",
          enum: ["text", "links", "metadata", "all"],
          description: "What to extract from the page"
        }
      },
      required: ["url"]
    }
  },
  {
    name: "complete",
    description: "Mark task as complete with results",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Summary of what was done" },
        data: { type: "object", description: "Structured result data" }
      },
      required: ["summary"]
    }
  }
];

const SYSTEM_PROMPT = `You are VybeR Agent, a server-side web research assistant.
You can search the web and fetch pages to gather information.
Be concise and efficient. Call the complete tool when done.`;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://vyberology.com,http://localhost:5173")
  .split(",").map(o => o.trim()).filter(Boolean);

// Simple HTML to text extraction
function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

// Extract links from HTML
function extractLinks(html, baseUrl) {
  const links = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null && links.length < 50) {
    try {
      const href = new URL(match[1], baseUrl).href;
      if (href.startsWith("http")) {
        links.push({ url: href, text: match[2].trim() });
      }
    } catch {}
  }
  return links;
}

// Extract metadata
function extractMetadata(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  return {
    title: titleMatch?.[1]?.trim() || "",
    description: descMatch?.[1]?.trim() || ""
  };
}

// Execute a tool
async function executeTool(name, input) {
  switch (name) {
    case "web_search": {
      const query = input.query;
      // Use DuckDuckGo HTML (no API key needed)
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "VybeR Agent/1.0" }
      });
      const html = await resp.text();
      const links = extractLinks(html, "https://duckduckgo.com");
      return {
        success: true,
        data: {
          query,
          results: links.slice(0, 10)
        }
      };
    }

    case "fetch_page": {
      const url = input.url;
      const extract = input.extract || "text";
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": "VybeR Agent/1.0" }
        });
        if (!resp.ok) {
          return { success: false, error: `HTTP ${resp.status}` };
        }
        const html = await resp.text();
        const result = { url };

        if (extract === "text" || extract === "all") {
          result.text = htmlToText(html);
        }
        if (extract === "links" || extract === "all") {
          result.links = extractLinks(html, url);
        }
        if (extract === "metadata" || extract === "all") {
          Object.assign(result, extractMetadata(html));
        }

        return { success: true, data: result };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }

    case "complete": {
      return {
        success: true,
        completed: true,
        data: { summary: input.summary, result: input.data }
      };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

// Run agent loop
async function runAgent(task, apiKey) {
  const messages = [{ role: "user", content: task }];
  const maxIterations = 10;

  for (let i = 0; i < maxIterations; i++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const assistantContent = result.content;
    messages.push({ role: "assistant", content: assistantContent });

    // Check for tool calls
    const toolCalls = assistantContent.filter(b => b.type === "tool_use");
    if (toolCalls.length === 0) {
      // No tools, just text response
      const textBlock = assistantContent.find(b => b.type === "text");
      return { success: true, summary: textBlock?.text || "Done" };
    }

    // Execute tools
    const toolResults = [];
    for (const tool of toolCalls) {
      const execResult = await executeTool(tool.name, tool.input);

      if (tool.name === "complete" && execResult.completed) {
        return {
          success: true,
          summary: execResult.data.summary,
          data: execResult.data.result
        };
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: tool.id,
        content: JSON.stringify(execResult)
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return { success: false, error: "Max iterations reached" };
}

exports.handler = async (event) => {
  const origin = event.headers.origin;
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  // Check for API key (header or env)
  const authHeader = event.headers.authorization || "";
  const apiKey = authHeader.replace("Bearer ", "") || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "API key required" })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid JSON" })
    };
  }

  const { task } = payload;
  if (!task || typeof task !== "string") {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Task is required" })
    };
  }

  try {
    const result = await runAgent(task, apiKey);
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: String(error) })
    };
  }
};
