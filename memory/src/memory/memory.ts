import db from "../db";
import {
  observationsTable,
  observationEmbeddings,
  entitiesTable,
  relationsTable,
} from "../db/schema/memory";
import {
  sql,
  eq,
  inArray,
  count,
  cosineDistance,
  SQL,
} from "drizzle-orm";
import openai, { createEmbedding } from "../ai/providers/openai";

export const listEntities = async () => {
  return db
    .select({
      id: entitiesTable.id,
      name: entitiesTable.name,
      num_observations: count(observationsTable.id).as("num_observations"),
      num_relations: sql<number>`COUNT(DISTINCT ${relationsTable.id})`.as("num_relations"),
    })
    .from(entitiesTable)
    .leftJoin(observationsTable, eq(entitiesTable.id, observationsTable.entityId))
    .leftJoin(relationsTable, sql`${entitiesTable.id} = ${relationsTable.fromEntityId} OR ${entitiesTable.id} = ${relationsTable.toEntityId}`)
    .groupBy(entitiesTable.id, entitiesTable.name);
}

export const insertObservation = async ({ entityId, content }: { entityId: number, content: string }) => {
  const [{ id }] = await db
    .insert(observationsTable)
    .values({ entityId, content })
    .returning({ id: observationsTable.id });

  createObservationEmbedding({ id, entityId, content });

  return id;
}

export async function createObservationEmbedding({ id, entityId, content }: { id: number, entityId: number | null, content: string }) {
  if (!entityId) {
    return;
  }

  const entity = await db.query.entitiesTable.findFirst({
    where: eq(entitiesTable.id, entityId),
    columns: {
      name: true,
      entityType: true
    },
    with: {
      relationsFrom: {
        columns: {
          relationType: true
        },
        with: { 
          toEntity: {
            columns: {
              name: true
            }
          }
        }
      },
      relationsTo: {
        columns: {
          relationType: true
        },
        with: { 
          fromEntity: {
            columns: {
              name: true
            }
          }
        }
      }
    }
  });

  let combinedText = content;

  if (entity) {
    combinedText += `\nEntity: ${entity.name} (${entity.entityType})`;
    entity.relationsFrom.forEach(rel => {
      if (rel.toEntity) {
        combinedText += `\n${entity.name} ${rel.relationType} ${rel.toEntity.name}`;
      }
    });
    entity.relationsTo.forEach(rel => {
      if (rel.fromEntity) {
        combinedText += `\n${rel.fromEntity.name} ${rel.relationType} ${entity.name}`;
      }
    });
  }

  const embedding = await createEmbedding(openai, combinedText);

  await db
    .insert(observationEmbeddings)
    .values({ id, embedding })
    .onConflictDoUpdate({
      target: observationEmbeddings.id,
      set: { embedding }
    });
}

type Observation = {
  id: number;
  content: string;
  distance: number;
}

/**
 * Returns a Drizzle "subquery" that yields the top-k observation IDs
 * plus their distance to `needle`.
 */
export async function findSimilarObservations(
  ctxEmbedding: number[],
  k: number = 10,
  probe: number = 5,
): Promise<Observation[]> {
  await db.execute(sql.raw(`SET ivfflat.probes = ${probe}`));

  const hits = db
    .select({
      id: observationEmbeddings.id,
      dist: cosineDistance(observationEmbeddings.embedding, ctxEmbedding).as('dist') as SQL.Aliased<number>,
    })
    .from(observationEmbeddings)
    .orderBy(cosineDistance(observationEmbeddings.embedding, ctxEmbedding))
    .limit(k)
    .as("vec_hits");

  // JOIN the k hits to the full observation rows
  return db
    .select({
      id: observationsTable.id,
      content: observationsTable.content,
      distance: hits.dist,
    })
    .from(hits)
    .innerJoin(observationsTable, eq(hits.id, observationsTable.id))
    .orderBy(hits.dist)
  ;
}

export async function findObservationWithGraph(
  ctxEmbedding: number[],
  k: number = 10
) {
  const vecHits = db
    .select({
      observationId: observationEmbeddings.id,
      dist: cosineDistance(observationEmbeddings.embedding, ctxEmbedding).as('dist') as SQL.Aliased<number>,
    })
    .from(observationEmbeddings)
    .orderBy(cosineDistance(observationEmbeddings.embedding, ctxEmbedding))
    .limit(k)
    .as("vec_hits");

  // Pull observation + the owning entity + its outgoing edges
  const rows = await db.query.observationsTable.findMany({
    where(fields) {
      return inArray(fields.id,
        db.select({ id: vecHits.observationId }).from(vecHits)
      );
    },
    with: {
      entity: {
        with: {
          relationsFrom: {
            with: { toEntity: true }
          },
          relationsTo: {
            with: { fromEntity: true }
          }
        }
      }
    }
  });

  return rows;
}

export async function hybridSearch(
  embedding: number[],
  ftsQuery: string,
  k: number = 25
) {
  // subquery: ANN
  const vecHits = db
    .select({
      observationId: observationEmbeddings.id,
      dist: cosineDistance(observationEmbeddings.embedding, embedding).as('dist')
    })
    .from(observationEmbeddings)
    .orderBy(cosineDistance(observationEmbeddings.embedding, embedding))
    .limit(k)
    .as("vec_hits");

  // subquery: full-text
  const ftsHits = db
    .select({
      id: observationsTable.id,
      ts_rank: sql<number>`ts_rank(observationsTable.tsv, to_tsquery(${ftsQuery}))`.as('ts_rank')
    })
    .from(observationsTable)
    .where(sql`observationsTable.tsv @@ to_tsquery(${ftsQuery})`)
    .as("fts_hits");

  // merge & rank
  return db
    .select({
      id: observationsTable.id,
      content: observationsTable.content,
      hybridScore: sql<number>`(1 - ${vecHits.dist}) + 0.5 * ${ftsHits.ts_rank}`.as('hybridScore')
    })
    .from(observationsTable)
    .innerJoin(vecHits, eq(vecHits.observationId, observationsTable.id))
    .innerJoin(ftsHits, eq(ftsHits.id, observationsTable.id))
    .orderBy(sql`hybridScore DESC`)
    .limit(20);
}

export async function createAllObservationEmbeddings() {
  const observations = await db.query.observationsTable.findMany({
    columns: {
      id: true,
      entityId: true,
      content: true,
    },
  });

  console.log(`Creating embeddings for ${observations.length} observations`);
  for (const observation of observations) {
    console.log(`Creating embedding for observation ${observation.id}`);
    await createObservationEmbedding({
      id: observation.id,
      entityId: observation.entityId,
      content: observation.content,
    });
  }
  console.log("Observation embeddings created");
}