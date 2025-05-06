import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import db from "../db";
import { chatsTable } from "../db/schema/chats";
import { sql } from "drizzle-orm";
import { reflect } from "../ai/chat-reflect";
import { insertMessages, getChatById, setChatSummary } from "../services/chats";

export const app = new Hono()
  // Get info about a Chat by its ID
  .get(
    "/:chatId",
    zValidator("param", z.object({ chatId: z.string() })),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const chat = await getChatById(chatId);
      if (!chat) return c.json({ error: "Chat not found" }, 404);
      return c.json(chat);
    }
  )
  // Create a new chat. Can optionally include the ID of an aichat session.
  .post(
    "/",
    zValidator("json", z.object({
      sessionId: z.string().optional().describe("ID of an aichat session to link to this chat"),
    })),
    async (c) => {
      const { sessionId } = c.req.valid("json");

      const [chat] = await db
        .insert(chatsTable)
        .values({
          sessionId: sessionId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json(chat);
    },
  )
  .put(
    "/:chatId/summary",
    zValidator("param", z.object({ chatId: z.string() })),
    zValidator("json", z.object({
      summary: z.string().describe("Summarize the discussion briefly in 200 words or less to use as a prompt for future context."),
    })),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const { summary } = c.req.valid("json");

      const success = await setChatSummary(chatId, summary);
      if (!success) return c.json({ error: "Chat not found" }, 404);

      return c.json({ ok: true });
    },
  )
  .put(
    "/:chatId/messages",
    zValidator("param", z.object({ chatId: z.string() })),
    zValidator("json", z.object({
      messages: z.array(z.object({
        role: z.string(),
        content: z.string(),
      })),
    })),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const { messages } = c.req.valid("json");

      await insertMessages({
        chatId,
        messages,
      });

      return c.json({ ok: true });
    },
  )
  .get(
    "/:chatId/reflect",
    zValidator("param", z.object({ chatId: z.string() })),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const messages = await db.execute<{ role: "user" | "assistant", content: string }>(sql`
        SELECT role, content FROM messages
        WHERE chat_id = ${chatId}
        AND role IN ('user', 'assistant')
        ORDER BY created_at
      `).then((res) => res.rows);

      if (messages.length === 0) {
        return c.json({ error: "No messages found" }, 404);
      }

      try {
        const reflection = await reflect(messages);
        return c.json(reflection);
      } catch (e) {
        console.error(`Error reflecting on chat ${chatId}: ${e}`);
        return c.json({ error: "Error reflecting on chat" }, 500);
      }
    },
  )
;

export default app;
export type App = typeof app;
