import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { $ } from "bun";
import { z } from "zod";

async function main() {
  const mcp = new McpServer({
    name: "reminders",
    version: "0.0.1",
  });
  const transport = new StdioServerTransport();
  
  mcp.tool(
    "reminder_add",
    "Add a new entry to the user's reminders.",
    {
      content: z.string().describe("Message to add to the reminder"),
    },
    {
      title: "Add Reminder",
      openWorldHint: false,
    },
    async ({ content }) => {
      const result = await $`shortcuts run "Add New Reminder" -i "${content}"`;
      if (result.exitCode !== 0) {
        console.error(result.stderr);
        return { content: [{ type: "text", text: "Failed to add reminder" }] };
      }
      return { content: [{ type: "text", text: "Added!" }] };
    },
  );

  mcp.tool(
    "reminder_list",
    "List the user's incomplete reminders",
    async () => {
      const result = await $`shortcuts run "View Reminders"`;
      if (result.exitCode !== 0) {
        console.error(result.stderr);
        return { content: [{ type: "text", text: "Failed to list reminders" }] };
      }
      return { content: [{ type: "text", text: result.text() }] };
    }
  );

  await mcp.connect(transport);
}

main();
