import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod";
import {
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
import { inArray, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { findSimilarObservations, insertObservation, listEntities } from "../services/memory";
import openai from "../ai/providers/openai";
import { createEmbedding } from "../ai/providers/openai";

export const provider = (mcp: McpServer) => {
  mcp.tool(
    "memory_list_entities",
    "List entities in the knowledge graph, showing the number of associated observations and relations.",
    async () => {
      return {
        content: [{
          type: "text",
          text: JSON.stringify(await listEntities()),
        }],
      };
    },
  );

  mcp.tool(
    "memory_create_entities",
    "Create entities in the knowledge graph",
    {
      entities: z.array(z.object({
        name: z.string().describe("The name of the entity"),
        entityType: z.string().describe("The type of the entity"),
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
        fromEntityId: z.number().describe("ID of the entity the relation is from"),
        toEntityId: z.number().describe("ID of the entity the relation is to"),
        relationType: z.string().describe("Verb that describes the relation"),
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
    "Add observations to an entity in the knowledge graph",
    {
      observations: z.array(z.object({
        content: z.string().describe("The content of the observation"),
        entityId: z.number().describe("The ID of the entity the observation is about"),
      })).describe("Observations to add to the knowledge graph. Each observation should be comprehensible on its own, and related to the entity."),
    },
    async ({ observations }) => {
      const ids = await Promise.all(observations.map(insertObservation));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(ids),
        }],
      };
    },
  );

  /*mcp.tool(
    "memory_set_observation_entity_id",
    "Set the entity ID of an observation whose entity ID is not set",
    {
      ids: z.array(z.object({
        observationId: z.number().describe("ID of the observation to set the entity ID of"),
        entityId: z.number().describe("ID of the entity to set the observation to"),
      })),
    },
    async ({ ids }) => {
      for (const id of ids) {
        await db
          .update(observationsTable)
          .set({ entityId: id.entityId })
          .where(eq(observationsTable.id, id.observationId));
      }

      return {
        content: [{
          type: "text",
          text: "Observation entity ID set successfully"
        }]
      }
    }
  );*/

  mcp.tool(
    "memory_delete_entities",
    "Delete entities from your memories by id",
    {
      entityIds: z.array(entitySelectSchema.shape.id.describe("ID of the entity to delete")),
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
      observationIds: z.array(observationSelectSchema.shape.id.describe("ID of the observation to delete")),
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
    { relationIds: z.array(relationSelectSchema.shape.id.describe("ID of the relation to delete")) },
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
      k: z.number().optional().default(10).describe("Number of results to return"),
    },
    async ({ query, k }) => {
      // Generate embedding for the query
      const queryEmbedding = await createEmbedding(openai, query);

      // Perform vector search for similar observations
      const similarObservations = await findSimilarObservations(queryEmbedding, k);
      
      return {
        content: [{
          type: "text",
          // Return the observations found by vector search
          text: JSON.stringify({ observations: similarObservations })
        }]
      }
    },
  );

  mcp.tool(
    "memory_open_nodes",
    "Open nodes in your memories",
    {
      entityNames: z.array(entitySelectSchema.shape.name.describe("Name of the entity to open")),
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
