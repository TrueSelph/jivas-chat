CREATE TABLE "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"sessionId" uuid DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT "threads_sessionId_unique" UNIQUE("sessionId")
);
--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;