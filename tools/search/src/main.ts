import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import wikipedia from "./wikipedia";
import arxiv from "./arxiv";
import wolfram from "./wolframalpha";
import tavily from "./tavily";
import perplexity from "./perplexity";
import aichat from "./aichat";

async function main() {
  const server = new McpServer({
    name: "search",
    version: "0.0.1",
  });
  const transport = new StdioServerTransport();

  wikipedia(server);
  wolfram(server);
  arxiv(server);
  tavily(server);
  perplexity(server);
  aichat(server);

  await server.connect(transport);
}

main();
