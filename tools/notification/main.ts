import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { $ } from "bun";
import { z } from "zod";

async function main() {
  const mcp = new McpServer({
    name: "notifications",
    version: "0.0.1",
  });
  const transport = new StdioServerTransport();
  
  mcp.tool(
    "send_notification",
    "Send a notification to the user",
    {
      message: z.string().describe("Message content of the notification"),
    },
    {
      title: "Send Notification",
      readOnlyHint: true,
    },
    async ({ message }) => {
      const result = await $`shortcuts run "Notification" -i "${message}"`;
      if (result.exitCode !== 0) {
        console.error(result.stderr);
        return { content: [{ type: "text", text: "Failed to send notification" }] };
      }
      return { content: [{ type: "text", text: "Sent!" }] };
    },
  );

  await mcp.connect(transport);
}

main();
