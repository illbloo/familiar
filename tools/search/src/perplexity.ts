import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from 'bun';

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export default function toolProvider(mcp: McpServer) {
  if (!env.PERPLEXITY_API_KEY) {
    console.error("PERPLEXITY_API_KEY environment variable is not set");
    return;
  }

  mcp.tool(
    "search_perplexity",
    "Perform a web search using Perplexity API to get up-to-date information or additional context.",
    {
      query: z.string().describe("The query to search for."),
    },
    async ({ query }) => {
      const model = env.PERPLEXITY_WEB_SEARCH_MODEL || "llama-3.1-sonar-small-128k-online";

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "authorization": `Bearer ${env.PERPLEXITY_API_KEY}`,
          "accept": "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: query,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as PerplexityResponse;
      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from Perplexity API");
      }

      return {
        content: [{
          type: "text",
          text: data.choices[0].message.content,
        }],
      };
    }
  );
} 