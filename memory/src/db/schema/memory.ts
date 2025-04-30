import { relations } from "drizzle-orm";
import { pgTable, timestamp, text, serial, varchar, integer, unique, index, vector } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const entitiesTable = pgTable("entities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 })
    .notNull(),
  entityType: varchar("entity_type", { length: 100 })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  unique("unique_name_type").on(table.name, table.entityType),
]);

export const entitySelectSchema = createSelectSchema(entitiesTable);
export const entityInsertSchema = createInsertSchema(entitiesTable);
export const entityUpdateSchema = createUpdateSchema(entitiesTable);

export type Entity = z.infer<typeof entitySelectSchema>;
export type NewEntity = z.infer<typeof entityInsertSchema>;
export type UpdateEntity = z.infer<typeof entityUpdateSchema>;

export const observationsTable = pgTable("observations", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id")
    .notNull()
    .references(() => entitiesTable.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const observationSelectSchema = createSelectSchema(observationsTable);
export const observationInsertSchema = createInsertSchema(observationsTable, {
  content: z.string().describe("The content of the observation"),
  entityId: z.number().describe("The ID of the entity the observation is about"),
});
export const observationUpdateSchema = createUpdateSchema(observationsTable);

export type Observation = z.infer<typeof observationSelectSchema>;
export type NewObservation = z.infer<typeof observationInsertSchema>;
export type UpdateObservation = z.infer<typeof observationUpdateSchema>;

export const relationsTable = pgTable("relations", {
  id: serial("id").primaryKey(),
  fromEntityId: integer("from_entity_id")
    .notNull()
    .references(() => entitiesTable.id, { onDelete: 'cascade' }),
  toEntityId: integer("to_entity_id")
    .notNull()
    .references(() => entitiesTable.id, { onDelete: 'cascade' }),
  relationType: varchar("relation_type", { length: 255 })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  unique("unique_relation").on(table.fromEntityId, table.toEntityId, table.relationType),
  index("from_entity_id_index").on(table.fromEntityId),
  index("to_entity_id_index").on(table.toEntityId),
]);

export const relationSelectSchema = createSelectSchema(relationsTable);
export const relationInsertSchema = createInsertSchema(relationsTable);
export const relationUpdateSchema = createUpdateSchema(relationsTable);

export type Relation = z.infer<typeof relationSelectSchema>;
export type NewRelation = z.infer<typeof relationInsertSchema>;
export type UpdateRelation = z.infer<typeof relationUpdateSchema>;

export const observationEmbeddings = pgTable("observation_embeddings", {
  id: integer("id").primaryKey()
    .references(() => observationsTable.id, { onDelete: "cascade" }),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
});

export const entitiesRelations = relations(entitiesTable, ({ many }) => ({
  observations: many(observationsTable),
  relationsFrom: many(relationsTable, { relationName: 'relationsFrom' }),
  relationsTo: many(relationsTable, { relationName: 'relationsTo' }),
}));

export const observationsRelations = relations(observationsTable, ({ one }) => ({
  entity: one(entitiesTable, { fields: [observationsTable.entityId], references: [entitiesTable.id] }),
}));

export const relationsRelations = relations(relationsTable, ({ one }) => ({
  fromEntity: one(entitiesTable, { fields: [relationsTable.fromEntityId], references: [entitiesTable.id], relationName: 'relationsFrom' }),
  toEntity: one(entitiesTable, { fields: [relationsTable.toEntityId], references: [entitiesTable.id], relationName: 'relationsTo' }),
}));
