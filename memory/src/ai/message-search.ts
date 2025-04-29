import db from "../db";
import {
  type Message,
  messageEmbeddingsTable,
  messagesTable,
} from "../db/schema/chats";
import openai from "./providers/openai";
import { cosineDistance, eq } from "drizzle-orm";

export const generateEmbedding = async (content: string): Promise<number[]> => {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });
  return embedding.data[0].embedding;
}

export const createEmbedding = async ({ id, content, role }: Message): Promise<void> => {
  await db.insert(messageEmbeddingsTable).values({
    messageId: id,
    embedding: await generateEmbedding(JSON.stringify({ content, role })),
  });
}

/**
 * Perform a natural language search
 */
export const searchMessages = async (
  query: string,
  limit: number = 10
): Promise<Message[]> => {
  // Generate embedding for the search query
  const embedding = await generateEmbedding(query);

  const results: Message[] = await db
    .select({
      id: messagesTable.id,
      content: messagesTable.content,
      role: messagesTable.role,
      chatId: messagesTable.chatId,
      createdAt: messagesTable.createdAt,
      updatedAt: messagesTable.updatedAt,
      //distance: cosineDistance(messageEmbeddingsTable.embedding, embedding)
    })
    .from(messagesTable)
    .innerJoin(messageEmbeddingsTable, eq(messagesTable.id, messageEmbeddingsTable.messageId))
    // Order by similarity (cosine distance)
    .orderBy(cosineDistance(messageEmbeddingsTable.embedding, embedding))
    .limit(limit);

  /*const result = await db.execute(sql`
    SELECT m.id, m.content, m.role, me.embedding <=> ${embedding} as similarity
    FROM messages m
    JOIN message_embeddings me ON m.id = me.message_id
    ORDER BY similarity ASC
    LIMIT ${limit}
  `);*/

  return results;
}
