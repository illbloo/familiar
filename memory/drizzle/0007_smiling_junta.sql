CREATE TABLE "users_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"facts" text,
	"created_at" timestamp DEFAULT now(),
	"last_active_at" timestamp DEFAULT now()
);
