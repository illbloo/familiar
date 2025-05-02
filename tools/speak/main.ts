import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { $ } from "bun";
import { z } from "zod";

async function main() {
  const mcp = new McpServer({
    name: "text_to_speech",
    version: "0.0.1",
  });
  const transport = new StdioServerTransport();
  
  mcp.tool(
    "speak_text",
    "Convert text to speech and say it aloud. Rain will hear this!",
    {
      text: z.string().describe("Text to convert to speech"),
    },
    {
      title: "Speak Text",
      readOnlyHint: true,
    },
    async ({ text }) => {
      const result = await $`shortcuts run "Text To Speech" -i "${text}"`;
      if (result.exitCode !== 0) {
        console.error(result.stderr);
        return { content: [{ type: "text", text: "Failed to speak text" }] };
      }
      return { content: [{ type: "text", text: "Spoken!" }] };
    },
  );

  await mcp.connect(transport);
}

main();
