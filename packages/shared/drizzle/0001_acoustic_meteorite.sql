ALTER TABLE "channel" ADD COLUMN "default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "metadata" jsonb;