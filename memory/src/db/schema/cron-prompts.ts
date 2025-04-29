import { pgTable, timestamp, text, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { chatsTable } from "./chats";
import { Message } from "./chats";

export const cronPromptsTable = pgTable("cron_prompts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  name: text("name").notNull(),
  expression: text("expression").notNull(),
  chatId: uuid("chat_id").notNull().references(() => chatsTable.id),
  messages: jsonb("messages").$type<CronPromptMessage[]>().notNull(),
});

export const cronPromptSelectSchema = createSelectSchema(cronPromptsTable);
export const cronPromptInsertSchema = createInsertSchema(cronPromptsTable);
export const cronPromptUpdateSchema = createUpdateSchema(cronPromptsTable);

export type CronPrompt = z.infer<typeof cronPromptSelectSchema>;
export type NewCronPrompt = z.infer<typeof cronPromptInsertSchema>;
export type UpdateCronPrompt = z.infer<typeof cronPromptUpdateSchema>;

export type CronPromptMessage = {
  role: Message["role"],
  content: Message["content"],
};
