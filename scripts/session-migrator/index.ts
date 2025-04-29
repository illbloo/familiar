import { sessionSchema } from "../../memory/src/types";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ChatAddMessagesParams } from "../../memory/src/mcp/chats";

const MEMORY_SERVER_URL = process.env.MEMORY_SERVER_URL || "http://localhost:3000/mcp";

async function main() {
  const dry_run = process.argv.includes("--dry-run");

  console.log("Reading session from stdin");
  const { data, error } = await Bun.stdin.json().then(sessionSchema.safeParse);
  if (error) {
    console.error(error);
    process.exit(1);
  }

  const messages = data.compressed_messages?.map(({ role, content }) => ({
    role,
    content: typeof content === "string" ? content : JSON.stringify(content),
  })) ?? [];

  if (!messages.length) {
    console.error("No messages found");
    process.exit(1);
  }

  if (dry_run) {
    console.log("Session parsed");
    console.log(data);
    process.exit(0);
  }

  console.log("Connecting to MCP API");
  const client = new Client({
    name: "session-migrator",
    version: "0.0.1",
  });
  const transport = new StreamableHTTPClientTransport(new URL(MEMORY_SERVER_URL));
  await client.connect(transport);

  const chatId = await client.callTool({
    name: "chat_create",
  }).then((result) => {
    if (result.isError) {
      console.error(result.content[0].text);
      process.exit(1);
    }
    return JSON.parse(result.content[0].text).id as string;
  });
  console.log("Chat created:", chatId);

  const result = await client.callTool({
    name: "chat_add_messages",
    arguments: { chatId, messages } satisfies ChatAddMessagesParams,
  });

  if (result.isError) {
    console.error(result.content[0].text);
    process.exit(1);
  }

  console.log("Session migrated:", result.content[0].text);
}

main();