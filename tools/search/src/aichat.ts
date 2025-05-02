import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from 'bun';

interface AIChatResponse {
  response: string;
}

export default function toolProvider(mcp: McpServer) {
  mcp.tool(
    "search_aichat",
    "Perform a web search using AIChat to get up-to-date information or additional context.",
    {
      query: z.string().describe("The query to search for."),
    },
    async ({ query }) => {
      const model = env.WEB_SEARCH_MODEL;
      if (!model) {
        throw new Error("WEB_SEARCH_MODEL environment variable is required");
      }

      const client = model.split(":")[0];
      let patchEnv = "";

      switch (client) {
        case "gemini":
          patchEnv = 'AICHAT_PATCH_GEMINI_CHAT_COMPLETIONS={"body":{"tools":[{"google_search":{}}]}}';
          break;
        case "vertexai":
          patchEnv = 'AICHAT_PATCH_VERTEXAI_CHAT_COMPLETIONS={"gemini-1.5-.*":{"body":{"tools":[{"googleSearchRetrieval":{}}]}},"gemini-2.0-.*":{"body":{"tools":[{"google_search":{}}]}}}';
          break;
        case "ernie":
          patchEnv = 'AICHAT_PATCH_ERNIE_CHAT_COMPLETIONS={"body":{"web_search":{"enable":true}}}';
          break;
        default:
          throw new Error(`Unsupported model client: ${client}`);
      }

      const response = await fetch("https://api.aichat.com/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          message: query,
          env: patchEnv,
        }),
      });

      if (!response.ok) {
        throw new Error(`AIChat API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as AIChatResponse;
      if (!data.response) {
        throw new Error("Invalid response format from AIChat API");
      }

      return {
        content: [{
          type: "text",
          text: data.response,
        }],
      };
    }
  );
} 