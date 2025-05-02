import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from 'bun';

export default function toolProvider(mcp: McpServer) {
  mcp.tool(
    "search_arxiv",
    "Search arXiv for a query and return the top papers as an XML string.",
    {
      query: z.string().describe("The query to search for."),
    },
    async ({ query }) => {
      const url = new URL("http://export.arxiv.org/api/query");
      url.searchParams.set("search_query", `all:${encodeURIComponent(query)}`);
      url.searchParams.set("max_results", env.ARXIV_MAX_RESULTS ?? '3');

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`arXiv API request failed with status ${res.status}: ${res.statusText}`);
      }
      const xml = await res.text();
      return {
        content: [{
          type: "text",
          text: xml,
        }],
      };
    }
  );
}