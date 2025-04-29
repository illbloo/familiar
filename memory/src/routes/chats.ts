import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import db from "../db";
import { Message } from "../db/schema/chats";
import { createEmbedding } from "../ai/message-search";
import { sql } from "drizzle-orm";
import { reflect } from "../ai/chat-reflect";

export const app = new Hono()
  .post(
    "/:chatId/embeddings",
    zValidator("param", z.object({ chatId: z.string() })),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const { rows } = await db.execute<Message>(sql`
        SELECT id, role, content FROM messages
        WHERE chat_id = ${chatId}
        AND role IN ('user', 'assistant')
        ORDER BY created_at
      `);
      if (rows.length > 0) {
        for (const row of rows) {
          await createEmbedding(row);
        }
      }
      return c.newResponse("ok");
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
  );
;

export default app;
