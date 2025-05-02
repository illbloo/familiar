import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export default function toolProvider(mcp: McpServer) {
  mcp.tool(
    "search_wikipedia",
    "Search Wikipedia for a query. Uses it to get detailed information about a public figure, interpretation of a complex scientific concept or in-depth connectivity of a significant historical event.",
    {
      query: z.string().describe("The query to search for."),
    },
    async ({ query }) => {
      const wikiApiUrl = new URL("https://en.wikipedia.org/w/api.php");

      // 1. Search for the page ID and title
      const searchParams = new URLSearchParams({
        action: "query",
        list: "search",
        srprop: "",
        srlimit: "1",
        limit: "1",
        srsearch: query,
        srinfo: "suggestion",
        format: "json",
      });
      wikiApiUrl.search = searchParams.toString();

      const searchRes = await fetch(wikiApiUrl);
      if (!searchRes.ok) {
        throw new Error(`Wikipedia search request failed with status ${searchRes.status}: ${searchRes.statusText}`);
      }
      const searchJson = await searchRes.json() as { query: WikipediaQueryResult };

      const searchResult = searchJson.query?.search?.[0];
      if (!searchResult?.title || !searchResult?.pageid) {
        const suggestion = searchJson.query?.searchinfo?.suggestion;
        let errorMsg = `No Wikipedia results found for '${query}'.`;
        if (suggestion) {
          errorMsg += ` Did you mean '${suggestion}'?`;
        }
        throw new Error(errorMsg);
      }

      const { title, pageid } = searchResult;

      // 2. Fetch the extract using the page ID
      const extractParams = new URLSearchParams({
        action: "query",
        prop: "extracts",
        explaintext: "",
        titles: title, // Use title found from search for better accuracy
        exintro: "",
        format: "json",
      });
      wikiApiUrl.search = extractParams.toString();

      const extractRes = await fetch(wikiApiUrl);
      if (!extractRes.ok) {
        throw new Error(`Wikipedia extract request failed with status ${extractRes.status}: ${extractRes.statusText}`);
      }
      const extractJson = await extractRes.json() as { query: WikipediaExtractQueryResult };

      const extract = extractJson.query?.pages?.[pageid]?.extract;
      if (!extract) {
        throw new Error(`Could not extract Wikipedia content for page '${title}' (ID: ${pageid}).`);
      }

      return {
        content: [{
          type: "text",
          text: extract,
        }],
      };
    }
  );
};

interface WikipediaSearchInfo {
  suggestion?: string;
}

interface WikipediaSearchItem {
  title: string;
  pageid: number;
}

interface WikipediaQueryResult {
  searchinfo: WikipediaSearchInfo;
  search: WikipediaSearchItem[];
}

interface WikipediaExtractQueryResult {
  pages: {
    [pageid: string]: {
      extract: string;
    };
  };
}