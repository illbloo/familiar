import { eq } from "drizzle-orm";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import db from "../db";
import { chatsTable, Chat, chatSelectSchema, Message, messagesTable, chatSummariesTable } from "../db/schema/chats";
import { insertMessages, getChatById, searchMessages } from "../services/chats";

export const provider = (mcp: McpServer) => {
  const chatCreateTool = mcp.tool(
    "chat_create",
    "Create a new Chat session",
    {
      title: "Create Chat",
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    async () => {
      const chat: Chat = await db
        .insert(chatsTable)
        .values({})
        .returning()
        .then(([chat]) => chat);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(chat),
          },
        ],
      };
    },
  );

  const chatListTool = mcp.tool(
    "chat_list",
    "List all Chat sessions",
    {
      title: "List Chat Sessions",
      readOnlyHint: true,
      openWorldHint: false,
    },
    async () => {
      const chats: Chat[] = await db.select().from(chatsTable);
      return {
        content: chats.map((chat) => {
          return {
            type: 'text',
            text: JSON.stringify(chat),
          };
        }),
      };
    }
  );

  const chatGetTool = mcp.tool(
    "chat_get",
    "Get information about a Chat",
    {
      id: chatSelectSchema.shape.id,
      title: "Get Chat Information",
      readOnlyHint: true,
      openWorldHint: false,
    },
    async ({ id }) => {
      const chat = await getChatById(id);

      return {
        content: [
          {
            type: 'text',
            text: !chat ? 'Chat not found' : JSON.stringify(chat),
          },
        ],
      };
    },
  );

  const chatListMessagesTool = mcp.tool(
    "chat_list_messages",
    "List messages from a chat",
    {
      id: chatSelectSchema.shape.id,
    },
    {
      title: "List Chat Messages",
      readOnlyHint: true,
      openWorldHint: false,
    },
    async ({ id }) => {
      const messages: Message[] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.chatId, id));

      return {
        content: messages.map((message) => {
          return {
            type: 'text',
            text: JSON.stringify(message),
          };
        }),
      };
    },
  );

  const chatAddMessagesTool = mcp.tool(
    "chat_add_messages",
    "Add messages to a Chat's history",
    {
      chatId: chatSelectSchema.shape.id,
      messages: z.object({
        content: z.string().describe("Message content"),
        role: z.string().describe("Message sender ('user', 'assistant')"),
      }).array(),
    },
    {
      title: "Add Messages to Chat",
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    async ({ chatId, messages }) => {
      await insertMessages({
        chatId,
        messages,
      });

      return {
        content: [
          {
            type: 'text',
            text: 'Messages added successfully',
          },
        ],
      };
    },
  );

  const chatSearchTool = mcp.tool(
    "chat_search",
    "Search Chat history",
    {
      query: z.string().describe("Natural language query"),
      limit: z.number().optional().default(10).describe("Number of results to return"),
    },
    {
      title: "Search Chat History",
      readOnlyHint: true,
      openWorldHint: false,
    },
    async ({ query, limit }) => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(await searchMessages(query, limit)),
          },
        ],
      };
    },
  );

  return {
    tools: [chatCreateTool, chatListTool, chatGetTool, chatListMessagesTool, chatAddMessagesTool, chatSearchTool],
    resources: [],
    prompts: [],
  };
}
