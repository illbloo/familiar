import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import db from "../db";
import { Message } from "../db/schema/chats";
import { createEmbedding } from "../ai/message-search";
import { sql } from "drizzle-orm";

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
  );

export default app;
