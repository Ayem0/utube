CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY,
	"owner_user_id" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" numeric NOT NULL,
	"type" smallint NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"variants" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"original_storage_key" text NOT NULL,
	"original_storage_key_deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"alias" text NOT NULL UNIQUE,
	"current_avatar_asset_id" uuid,
	"pending_avatar_asset_id" uuid,
	"default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" uuid PRIMARY KEY,
	"channel_id" uuid NOT NULL,
	"source_video_asset_id" uuid NOT NULL,
	"current_thumbnail_asset_id" uuid,
	"pending_thumbnail_asset_id" uuid,
	"current_playback_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"visibility" smallint DEFAULT 0 NOT NULL,
	"duration" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_playback" (
	"id" uuid PRIMARY KEY,
	"video_id" uuid NOT NULL,
	"hls_master_key" text,
	"dash_manifest_key" text,
	"storyboard_key" text,
	"status" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"renditions" jsonb
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "asset_ownerUserId_idx" ON "asset" ("owner_user_id");--> statement-breakpoint
CREATE INDEX "channel_userId_idx" ON "channel" ("user_id");--> statement-breakpoint
CREATE INDEX "channel_currentAvatarAssetId_idx" ON "channel" ("current_avatar_asset_id");--> statement-breakpoint
CREATE INDEX "channel_pendingAvatarAssetId_idx" ON "channel" ("pending_avatar_asset_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "video_channelId_idx" ON "video" ("channel_id");--> statement-breakpoint
CREATE INDEX "video_sourceVideoAssetId_idx" ON "video" ("source_video_asset_id");--> statement-breakpoint
CREATE INDEX "video_currentThumbnailAssetId_idx" ON "video" ("current_thumbnail_asset_id");--> statement-breakpoint
CREATE INDEX "video_currentPlaybackId_idx" ON "video" ("current_playback_id");--> statement-breakpoint
CREATE INDEX "video_playback_videoId_idx" ON "video_playback" ("video_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_owner_user_id_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_current_avatar_asset_id_asset_id_fkey" FOREIGN KEY ("current_avatar_asset_id") REFERENCES "asset"("id");--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_pending_avatar_asset_id_asset_id_fkey" FOREIGN KEY ("pending_avatar_asset_id") REFERENCES "asset"("id");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_channel_id_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channel"("id");--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_source_video_asset_id_asset_id_fkey" FOREIGN KEY ("source_video_asset_id") REFERENCES "asset"("id");--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_current_thumbnail_asset_id_asset_id_fkey" FOREIGN KEY ("current_thumbnail_asset_id") REFERENCES "asset"("id");--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_pending_thumbnail_asset_id_asset_id_fkey" FOREIGN KEY ("pending_thumbnail_asset_id") REFERENCES "asset"("id");--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_current_playback_id_video_playback_id_fkey" FOREIGN KEY ("current_playback_id") REFERENCES "video_playback"("id");--> statement-breakpoint
ALTER TABLE "video_playback" ADD CONSTRAINT "video_playback_video_id_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "video"("id");