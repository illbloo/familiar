import { Hono } from "hono";
import { createAllObservationEmbeddings } from "../services/memory";
import { zValidator } from "@hono/zod-validator";
import { messageEmbeddingsTable, messagesTable } from "../db/schema/chats";
import z from "zod";
import { inArray, eq, isNull, and } from "drizzle-orm";
import db from "../db";
import openai, { createEmbedding } from "../ai/providers/openai";

const app = new Hono()
  .post("/memory_embeddings", async (c) => {
    createAllObservationEmbeddings();
    return c.json({ message: "Accepted" }, 202);
  })
  // generate embeddings for chat messages
  // todo: move this to a queue consumer
  .post(
    "/message_embeddings",
    zValidator(
      "json",
      z.object({
        messageIds: z.array(z.string()),
      }),
    ),
    async (c) => {
      const { messageIds } = c.req.valid("json");

      // find messages that don't have embeddings
      const messages = await db
        .select({
          id: messagesTable.id,
          content: messagesTable.content,
          role: messagesTable.role,
        })
        .from(messagesTable)
        .leftJoin(messageEmbeddingsTable, eq(messagesTable.id, messageEmbeddingsTable.messageId))
        .where(and(
          inArray(messagesTable.id, messageIds),
          // don't generate embeddings for system messages and tool calls
          inArray(messagesTable.role, ["user", "assistant"]),
          // skip messages that already have embeddings
          isNull(messageEmbeddingsTable.id),
        ));

      if (messages.length > 0) {
        console.log(`Creating embeddings for ${messages.length} messages`);

        // create embeddings
        const embeddings = await Promise.all(messages.map(async (message) => ({
          messageId: message.id,
          embedding: await createEmbedding(openai, JSON.stringify({
            role: message.role,
            content: message.content,
          })),
        })));

        await db.insert(messageEmbeddingsTable).values(embeddings);
      }

      return c.json({ message: "Accepted" }, 202);
    }
  );

export default app;
