import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from 'bun';

interface TavilyResponse {
  answer: string;
}

export default function toolProvider(mcp: McpServer) {
  if (!env.TAVILY_API_KEY) {
    console.error("TAVILY_API_KEY environment variable is not set");
    return;
  }
  
  mcp.tool(
    "search_tavily",
    "Perform a web search using Tavily API to get up-to-date information or additional context.",
    {
      query: z.string().describe("The query to search for."),
    },
    async ({ query }) => {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          api_key: env.TAVILY_API_KEY,
          query: query,
          include_answer: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as TavilyResponse;
      return {
        content: [{
          type: "text",
          text: data.answer,
        }],
      };
    }
  );
} 