import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from 'bun';

interface WolframAlphaSubPod {
  plaintext: string;
}

interface WolframAlphaPod {
  title: string;
  subpods: WolframAlphaSubPod[];
}

interface WolframAlphaQueryResult {
  queryresult: {
    pods: WolframAlphaPod[];
    success: boolean;
    error: boolean | { msg: string }; // error can be true/false or an object
  };
}

export default function toolProvider(mcp: McpServer) {
  mcp.tool(
    "search_wolframalpha",
    "Get an answer to a question using Wolfram Alpha. Input should the query in English. Use it to answer user questions that require computation, detailed facts, data analysis, or complex queries.",
    {
      query: z.string().describe("The query to search for."),
    },
    async ({ query }) => {
      const apiKey = env.WOLFRAM_API_ID;
      if (!apiKey) {
        throw new Error("WOLFRAM_API_ID environment variable is not set.");
      }

      const url = new URL("https://api.wolframalpha.com/v2/query");
      url.searchParams.set("appid", apiKey);
      url.searchParams.set("input", query);
      url.searchParams.set("output", "json");
      url.searchParams.set("format", "plaintext"); // Request plaintext format

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`WolframAlpha API request failed with status ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as WolframAlphaQueryResult;

      if (!json.queryresult || json.queryresult.error) {
        const errorMsg = typeof json.queryresult?.error === 'object'
          ? json.queryresult.error.msg
          : 'WolframAlpha query failed or returned an error.';
        throw new Error(`WolframAlpha error: ${errorMsg}`);
      }

      if (!json.queryresult.success) {
        throw new Error("WolframAlpha query was not successful.");
      }

      // Process pods similar to the jq script
      const processedPods = json.queryresult.pods
        .map(pod => ({
          title: pod.title,
          values: pod.subpods
            ?.map(subpod => subpod.plaintext)
            .filter(text => text && text.trim() !== '') ?? [], // Filter out empty strings
        }))
        .filter(pod => pod.values.length > 0); // Filter out pods with no valid values


      // Return structured data as JSON string or plain text
      // Choose one format based on how the LLM is expected to consume it.
      // Returning JSON string:
      // const outputText = JSON.stringify(processedPods, null, 2); 

      // Returning formatted plain text:
      const outputText = processedPods.map(pod =>
        `${pod.title}:\n${pod.values.map(v => `- ${v}`).join('\n')}`
      ).join('\n\n');


      return {
        content: [{
          type: "text", // Or potentially "json" if returning stringified JSON
          text: outputText,
        }],
      };
    }
  );
}
