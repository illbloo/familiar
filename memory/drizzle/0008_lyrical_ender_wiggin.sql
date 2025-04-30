ALTER TABLE "relations" DROP CONSTRAINT "relations_from_entity_id_to_entity_id_relation_type_unique";--> statement-breakpoint
CREATE INDEX "from_entity_id_index" ON "relations" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "to_entity_id_index" ON "relations" USING btree ("to_entity_id");--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "unique_name_type" UNIQUE("name","entity_type");--> statement-breakpoint
ALTER TABLE "relations" ADD CONSTRAINT "unique_relation" UNIQUE("from_entity_id","to_entity_id","relation_type");