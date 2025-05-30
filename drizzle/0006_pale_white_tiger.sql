CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "instances" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"host" text NOT NULL,
	"email" text NOT NULL,
	"token" "bytea" NOT NULL,
	"createdAt" timestamp DEFAULT now () NOT NULL
);

--> statement-breakpoint
ALTER TABLE "prompts"
ADD COLUMN "updatedAt" timestamp DEFAULT now () NOT NULL;

--> statement-breakpoint
ALTER TABLE "instances" ADD CONSTRAINT "instances_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE no action ON UPDATE no action;
