import { pgTable, timestamp, text, uuid, vector } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export const chatsTable = pgTable("chats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatSelectSchema = createSelectSchema(chatsTable);
export const chatInsertSchema = createInsertSchema(chatsTable);
export const chatUpdateSchema = createUpdateSchema(chatsTable);

export type Chat = z.infer<typeof chatSelectSchema>;
export type NewChat = z.infer<typeof chatInsertSchema>;
export type UpdateChat = z.infer<typeof chatUpdateSchema>;

export const messagesTable = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  role: text("role").notNull(),
  chatId: uuid("chat_id").references(() => chatsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messageSelectSchema = createSelectSchema(messagesTable);
export const messageInsertSchema = createInsertSchema(messagesTable);
export const messageUpdateSchema = createUpdateSchema(messagesTable);

export type Message = z.infer<typeof messageSelectSchema>;
export type NewMessage = z.infer<typeof messageInsertSchema>;
export type UpdateMessage = z.infer<typeof messageUpdateSchema>;

export const messageEmbeddingsTable = pgTable("message_embeddings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  messageId: uuid("message_id").references(() => messagesTable.id),
});

export const messageEmbeddingSelectSchema = createSelectSchema(messageEmbeddingsTable);
export const messageEmbeddingInsertSchema = createInsertSchema(messageEmbeddingsTable);
export const messageEmbeddingUpdateSchema = createUpdateSchema(messageEmbeddingsTable);

export type MessageEmbedding = z.infer<typeof messageEmbeddingSelectSchema>;
export type NewMessageEmbedding = z.infer<typeof messageEmbeddingInsertSchema>;
export type UpdateMessageEmbedding = z.infer<typeof messageEmbeddingUpdateSchema>;

export const chatsRelations = relations(chatsTable, ({ many }) => ({
  messages: many(messagesTable),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  chat: one(chatsTable, { fields: [messagesTable.chatId], references: [chatsTable.id] }),
}));

export const messageEmbeddingsRelations = relations(messageEmbeddingsTable, ({ one }) => ({
  message: one(messagesTable, { fields: [messageEmbeddingsTable.messageId], references: [messagesTable.id] }),
}));