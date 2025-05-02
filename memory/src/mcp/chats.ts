import { eq } from "drizzle-orm";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import db from "../db";
import { chatsTable, Chat, chatSelectSchema, Message, messagesTable } from "../db/schema/chats";
import { insertMessages, getChatById, searchMessages } from "../services/chats";

export const provider = (mcp: McpServer) => {
  mcp.tool(
    "chat_create",
    "Create a new Chat session",
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

  mcp.tool(
    "chat_list",
    "List all Chat sessions",
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

  mcp.tool(
    "chat_get",
    "Get information about a Chat",
    {
      id: chatSelectSchema.shape.id,
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

  /*mcp.tool(
    "update_chat",
    "Update a chat by ID",
    {
      ...chatUpdateSchema.shape,
      id: z.string(),
    },
    async (args) => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(await updateChat(args)),
          },
        ],
      };
    },
  );*/

  mcp.tool(
    "chat_delete",
    "Delete a chat by ID",
    {
      id: chatSelectSchema.shape.id,
    },
    async ({ id }) => {
      await db.delete(chatsTable).where(eq(chatsTable.id, id));
      return {
        content: [
          {
            type: 'text',
            text: 'Chat deleted successfully',
          },
        ],
      };
    },
  );

  mcp.tool(
    "chat_list_messages",
    "List messages from a chat",
    {
      id: chatSelectSchema.shape.id,
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

  mcp.tool(
    "chat_add_messages",
    "Add messages to a Chat's history",
    {
      chatId: chatSelectSchema.shape.id,
      messages: z.object({
        content: z.string().describe("Message content"),
        role: z.string().describe("Message sender ('user', 'assistant')"),
      }).array(),
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

  mcp.tool(
    "chat_search",
    "Search Chat history",
    {
      query: z.string().describe("Natural language query"),
      limit: z.number().optional().default(10).describe("Number of results to return"),
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
}