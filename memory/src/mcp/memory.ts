import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod";
import {
  entityInsertSchema,
  observationInsertSchema,
  entitiesTable,
  Entity,
  observationsTable,
  Observation,
  relationsTable,
  Relation,
  observationSelectSchema,
  entitySelectSchema,
  relationSelectSchema,
} from "../db/schema/memory";
import db from "../db";
import { inArray, ilike, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const provider = (mcp: McpServer) => {
  mcp.tool(
    "memory_create_entities",
    "Create entities in the knowledge graph",
    {
      entities: z.array(entityInsertSchema.omit({
        id: true,
        updatedAt: true,
        createdAt: true,
      })),
    },
    async ({ entities }) => {
      const result: Entity[] = await db
        .insert(entitiesTable)
        .values(entities)
        .returning();

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result),
        }],
      };
    },
  );

  mcp.tool(
    "memory_create_relations",
    "Create relations in the knowledge graph",
    {
      relations: z.array(z.object({
        from: z.string(),
        to: z.string(),
        relationType: z.string(),
      })),
    },
    async ({ relations }) => {
      const result: Relation[] = await db
        .insert(relationsTable)
        .values(relations)
        .returning();

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result),
        }],
      };
    },
  );

  mcp.tool(
    "memory_add_observations",
    "Add observations to the knowledge graph",
    {
      observations: z.array(observationInsertSchema.pick({
        id: true,
        entityId: true,
        content: true,
      })),
    },
    async ({ observations }) => {
      const result: Observation[] = await db
        .insert(observationsTable)
        .values(observations)
        .returning();

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result),
        }],
      };
    },
  );

  mcp.tool(
    "memory_delete_entities",
    "Delete entities from your memories by id",
    {
      entityIds: z.array(entitySelectSchema.shape.id),
    },
    async ({ entityIds }) => {
      await db
        .delete(entitiesTable)
        .where(inArray(entitiesTable.id, entityIds));

      return {
        content: [{
          type: "text",
          text: "Entities deleted successfully"
        }]
      };
    },
  );

  mcp.tool(
    "memory_delete_observations",
    "Delete observations from memory by their IDs",
    {
      observationIds: z.array(observationSelectSchema.shape.id),
    },
    async ({ observationIds }) => {
      await db
        .delete(observationsTable)
        .where(inArray(observationsTable.id, observationIds));

      return {
        content: [{
          type: "text",
          text: "Observations deleted successfully"
        }],
      };
    }
  );

  mcp.tool(
    "memory_delete_relations",
    "Delete relations from your memories by their IDs",
    { relationIds: z.array(relationSelectSchema.shape.id) },
    async ({ relationIds }) => {
      await db
        .delete(relationsTable)
        .where(inArray(relationsTable.id, relationIds));

      return { content: [{ type: "text", text: "success" }] };
    }
  );

  mcp.tool(
    "memory_read_graph",
    "Read the entire memory knowledge graph (warning: uses a lot of tokens)",
    {},
    async () => {
      const [entities, observations, relations] = await Promise.all([
        db.select().from(entitiesTable),
        db.select().from(observationsTable),
        db.select().from(relationsTable),
      ]);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ entities, observations, relations }),
        }],
      };
    },
  );

  mcp.tool(
    "memory_search_nodes",
    "Search your memories with a semantic query",
    {
      query: z.string().describe("Semantic search query"),
    },
    async ({ query }) => {
      const likeQuery = `%${query}%`;
      const entities = await db
        .select()
        .from(entitiesTable)
        .where(ilike(entitiesTable.name, likeQuery));

      // Maybe search observations content too?
      const observations = await db
        .select()
        .from(observationsTable)
        .leftJoin(entitiesTable, eq(observationsTable.entityId, entitiesTable.id))
        .where(ilike(observationsTable.content, likeQuery));

      // You might want to structure the result differently, e.g., group observations by entity

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ entities, observations })
        }]
      }
    },
  );

  mcp.tool(
    "memory_open_nodes",
    "Open nodes in your memories",
    {
      entityNames: z.array(entitySelectSchema.shape.name),
    },
    async ({ entityNames }) => {
      const relationsFromAlias = alias(relationsTable, 'relationsFrom');
      const relationsToAlias = alias(relationsTable, 'relationsTo');

      const results = await db
        .select()
        .from(entitiesTable)
        .where(inArray(entitiesTable.name, entityNames))
        .leftJoin(observationsTable, eq(entitiesTable.id, observationsTable.entityId))
        .leftJoin(relationsFromAlias, eq(entitiesTable.id, relationsFromAlias.fromEntityId))
        .leftJoin(relationsToAlias, eq(entitiesTable.id, relationsToAlias.toEntityId));

      // This query fetches related data but doesn't structure it hierarchically.
      // You would likely need further processing in your application layer
      // to present this data as a connected graph for the opened nodes.

      // Simple grouping for demonstration
      const groupedResults = results.reduce((acc, row) => {
        const entity = row.entities;
        const observation = row.observations;
        const relationFrom = row.relationsFrom;
        const relationTo = row.relationsTo;

        if (!acc[entity.id]) {
          acc[entity.id] = {
            ...entity,
            observations: [],
            relationsFrom: [],
            relationsTo: [],
          };
        }

        if (observation && !acc[entity.id].observations.find(o => o.id === observation.id)) {
          acc[entity.id].observations.push(observation);
        }
        if (relationFrom && !acc[entity.id].relationsFrom.find(r => r.id === relationFrom.id)) {
          acc[entity.id].relationsFrom.push(relationFrom);
        }
        if (relationTo && !acc[entity.id].relationsTo.find(r => r.id === relationTo.id)) {
          acc[entity.id].relationsTo.push(relationTo);
        }

        return acc;
      }, {} as Record<number, Entity & { observations: Observation[], relationsFrom: Relation[], relationsTo: Relation[] }>);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(Object.values(groupedResults)),
        }],
      };
    },
  );
}
