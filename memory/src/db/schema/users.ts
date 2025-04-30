import { sql } from "drizzle-orm";
import { uuid, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users_info", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  facts: text("facts"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const usersSelectSchema = createSelectSchema(usersTable);
export const usersInsertSchema = createInsertSchema(usersTable);
export const usersUpdateSchema = createUpdateSchema(usersTable);

export type User = z.infer<typeof usersSelectSchema>;
export type NewUser = z.infer<typeof usersInsertSchema>;
export type UpdateUser = z.infer<typeof usersUpdateSchema>;
