CREATE TABLE "observation_embeddings" (
	"id" integer PRIMARY KEY NOT NULL,
	"embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "observation_embeddings" ADD CONSTRAINT "observation_embeddings_id_observations_id_fk" FOREIGN KEY ("id") REFERENCES "public"."observations"("id") ON DELETE cascade ON UPDATE no action;