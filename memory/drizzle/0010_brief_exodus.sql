ALTER TABLE "entities" DROP CONSTRAINT "entities_name_unique";--> statement-breakpoint
ALTER TABLE "observations" ALTER COLUMN "entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "relations" ALTER COLUMN "from_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "relations" ALTER COLUMN "to_entity_id" SET NOT NULL;