import { chatsTable, messagesTable, Chat, Message, messageEmbeddingsTable } from "../db/schema/chats";
import db from "../db";
import { sql, eq, cosineDistance } from "drizzle-orm";
import openai from "../ai/providers/openai";
import { createEmbedding } from "../ai/providers/openai";

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  const [chat] = await db
    .select({
      id: chatsTable.id,
      sessionId: chatsTable.sessionId,
      createdAt: chatsTable.createdAt,
      updatedAt: chatsTable.updatedAt,
      messageCount: sql<number>`COUNT(${messagesTable.id})`.mapWith(Number),
    })
    .from(chatsTable)
    .where(eq(chatsTable.id, chatId))
    .leftJoin(messagesTable, eq(chatsTable.id, messagesTable.chatId))
    .groupBy(chatsTable.id);

  return chat ?? null;
}

export interface ChatAddMessagesParams {
  chatId: string;
  messages: {
    content: string;
    role: string;
  }[];
}

export const insertMessages = async ({ messages, chatId }: ChatAddMessagesParams) => {
  const messageIds: string[] = await db
    .insert(messagesTable)
    .values(messages.map((m) => ({
      ...m,
      chatId,
    })))
    .returning({ id: messagesTable.id })
    .then((rows) => rows.map((r) => r.id));

  // todo: proper event dispatcher
  console.debug(`dispatching message embeddings job for ${chatId}`);
  const res = await fetch(`http://localhost:3000/jobs/message_embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageIds,
    }),
  });
  if (!res.ok) {
    throw new Error(`Error dispatching job: ${res.statusText}`);
  }
}

/**
 * Perform a natural language search of chat history
 */
export const searchMessages = async (
  query: string,
  limit: number = 10
): Promise<Message[]> => {
  // Generate embedding for the search query
  const embedding = await createEmbedding(openai, query);

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
