CREATE TABLE "chat_summaries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_summaries" ADD CONSTRAINT "chat_summaries_id_chats_id_fk" FOREIGN KEY ("id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;