import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * posts table, for Oblivion (fake social network). essentially just a way to get myself to stop tweeting so much - and also make it easier for LLMs to read my thoughts~
 */
export const postsTable = pgTable("posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("created_at_idx").on(t.createdAt),
]);

export const postsSelectSchema = createSelectSchema(postsTable);
export const postsInsertSchema = createInsertSchema(postsTable);
export const postsUpdateSchema = createUpdateSchema(postsTable);

export type Post = z.infer<typeof postsSelectSchema>;
export type NewPost = z.infer<typeof postsInsertSchema>;
export type UpdatePost = z.infer<typeof postsUpdateSchema>;
