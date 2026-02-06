/**
 * VybeR Browsing Agent Tools
 *
 * These tools allow Claude to interact with web pages through the browser.
 * Each tool is defined with a JSON schema for Claude's tool_use API.
 */

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const AGENT_TOOLS: Tool[] = [
  {
    name: "navigate",
    description: "Navigate to a URL in the current tab. Use this to open websites, search Google, or go to specific pages.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to navigate to. Can be a full URL or a search query (will search Google)."
        }
      },
      required: ["url"]
    }
  },
  {
    name: "extract_text",
    description: "Extract all visible text content from the current page. Use this to read and understand page content.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Optional CSS selector to extract text from a specific element. If not provided, extracts all visible text."
        },
        max_length: {
          type: "number",
          description: "Maximum characters to return. Default is 8000."
        }
      }
    }
  },
  {
    name: "extract_links",
    description: "Extract all links from the current page with their text and URLs.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Optional CSS selector to limit link extraction to a specific area."
        },
        max_links: {
          type: "number",
          description: "Maximum number of links to return. Default is 50."
        }
      }
    }
  },
  {
    name: "click",
    description: "Click on an element on the page by CSS selector or visible text.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector of the element to click."
        },
        text: {
          type: "string",
          description: "Visible text of the element to click (alternative to selector)."
        }
      }
    }
  },
  {
    name: "fill_form",
    description: "Fill in a form field with text.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector of the input field."
        },
        value: {
          type: "string",
          description: "The text to fill in."
        },
        submit: {
          type: "boolean",
          description: "Whether to submit the form after filling. Default false."
        }
      },
      required: ["selector", "value"]
    }
  },
  {
    name: "screenshot",
    description: "Take a screenshot of the current page or a specific element.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Optional CSS selector to screenshot only a specific element."
        },
        full_page: {
          type: "boolean",
          description: "Whether to capture the full scrollable page. Default false."
        }
      }
    }
  },
  {
    name: "scroll",
    description: "Scroll the page in a direction or to a specific element.",
    input_schema: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["up", "down", "top", "bottom"],
          description: "Direction to scroll."
        },
        selector: {
          type: "string",
          description: "CSS selector of element to scroll into view (alternative to direction)."
        },
        amount: {
          type: "number",
          description: "Pixels to scroll. Default is one viewport height."
        }
      }
    }
  },
  {
    name: "wait",
    description: "Wait for a condition before proceeding.",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "Wait for this element to appear on the page."
        },
        timeout: {
          type: "number",
          description: "Maximum milliseconds to wait. Default is 5000."
        }
      }
    }
  },
  {
    name: "get_page_info",
    description: "Get information about the current page including URL, title, and metadata.",
    input_schema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "search_google",
    description: "Search Google for a query and return the results.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query."
        }
      },
      required: ["query"]
    }
  },
  {
    name: "open_tab",
    description: "Open a new browser tab.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Optional URL to open in the new tab. If not provided, opens a blank tab."
        }
      }
    }
  },
  {
    name: "close_tab",
    description: "Close the current tab.",
    input_schema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "complete",
    description: "Mark the task as complete and provide a final response to the user.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "A summary of what was accomplished."
        },
        data: {
          type: "object",
          description: "Any structured data to return (e.g., extracted information)."
        }
      },
      required: ["summary"]
    }
  }
];

export type ToolName = typeof AGENT_TOOLS[number]["name"];

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  screenshot?: string; // base64 encoded
}
