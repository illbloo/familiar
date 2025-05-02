import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { $ } from "bun";
import { z } from "zod";

async function main() {
  const mcp = new McpServer({
    name: "screenshot",
    version: "0.0.1",
  });
  const transport = new StdioServerTransport();
  
  mcp.tool(
    "ask_for_screenshot",
    "Prompt the user to take a screenshot. It will be returned as a base64-encoded PNG image.",
    {
      title: "Ask for Screenshot",
      readOnlyHint: true,
    },
    async () => {
      const result = await $`shortcuts run "Take Screenshot"`;
      if (result.exitCode !== 0) {
        console.error(result.stderr);
        return { content: [{ type: "text", text: "Failed to take screenshot" }] };
      }
      return {
        content: [{
          type: "image",
          data: result.stdout.toString(),
          mimeType: "image/png",
        }],
      };
    },
  );

  await mcp.connect(transport);
}

main();
