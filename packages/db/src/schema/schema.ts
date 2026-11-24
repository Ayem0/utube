import {
  assetStatus,
  type AssetStatus,
} from "@repo/types/enums/asset/asset-status";
import { type AssetType } from "@repo/types/enums/asset/asset-type";
import {
  videoAttemptStatus,
  type VideoAttemptStatus,
} from "@repo/types/enums/video/video-attempt-status";
import {
  videoVisibility,
  type VideoVisibility,
} from "@repo/types/enums/video/video-visibility";
import { type AssetVariant } from "@repo/types/schemas/asset-variant";
import { type VideoRenditions } from "@repo/types/schemas/video-renditions";

import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at"),
});

// #region Custom tables
export const video = pgTable(
  "video",
  {
    id: uuid("id").primaryKey(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => channel.id, { onDelete: "no action" }),
    sourceVideoAssetId: uuid("source_video_asset_id")
      .notNull()
      .references(() => asset.id, { onDelete: "no action" }),
    currentThumbnailAssetId: uuid("current_thumbnail_asset_id").references(
      () => asset.id,
      { onDelete: "no action" },
    ),
    pendingThumbnailAssetId: uuid("pending_thumbnail_asset_id").references(
      () => asset.id,
      { onDelete: "no action" },
    ),
    currentPlaybackId: uuid("current_playback_id").references(
      () => videoPlayback.id,
      { onDelete: "no action" },
    ),
    latestAttemptId: uuid("latest_attempt_id").references(
      (): AnyPgColumn => videoAttempt.id,
      { onDelete: "no action" },
    ),
    title: text("title").notNull(),
    description: text("description"),
    visibility: smallint("visibility")
      .notNull()
      .default(videoVisibility.DRAFT)
      .$type<VideoVisibility>(),
    duration: numeric("duration", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    publishedAt: timestamp("published_at"),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("video_channelId_idx").on(table.channelId),
    index("video_sourceVideoAssetId_idx").on(table.sourceVideoAssetId),
    index("video_currentThumbnailAssetId_idx").on(
      table.currentThumbnailAssetId,
    ),
    index("video_currentPlaybackId_idx").on(table.currentPlaybackId),
    index("video_latestAttemptId_idx").on(table.latestAttemptId),
  ],
);

export const videoAttempt = pgTable(
  "video_attempt",
  {
    id: uuid("id").primaryKey(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => video.id, { onDelete: "no action" }),

    assetId: uuid("asset_id")
      .notNull()
      .references(() => asset.id, { onDelete: "no action" }),
    status: smallint("status")
      .notNull()
      .default(videoAttemptStatus.WAITING_FOR_UPLOAD)
      .$type<VideoAttemptStatus>(),

    processingVersion: integer("processing_version").notNull().default(1),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("video_attempt_videoId_idx").on(table.videoId),
    index("video_attempt_assetId_idx").on(table.assetId),
  ],
);

export const videoPlayback = pgTable(
  "video_playback",
  {
    id: uuid("id").primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references((): AnyPgColumn => videoAttempt.id, {
        onDelete: "no action",
      }),
    hlsMasterKey: text("hls_master_key").notNull(),
    dashManifestKey: text("dash_manifest_key").notNull(),
    storyboardKey: text("storyboard_key").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    renditions: jsonb("renditions").$type<VideoRenditions>().notNull(),
  },
  (table) => [index("video_playback_attemptId_idx").on(table.attemptId)],
);

export const asset = pgTable(
  "asset",
  {
    id: uuid("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "no action" }),
    mimeType: text("mime_type").notNull(),
    sizeBytes: numeric("size_bytes", { mode: "number" }).notNull(),
    type: smallint("type").notNull().$type<AssetType>(),
    status: smallint("status")
      .notNull()
      .default(assetStatus.PENDING)
      .$type<AssetStatus>(),
    variants: jsonb("variants").$type<AssetVariant>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    uploadExpiresAt: timestamp("upload_expires_at").notNull(),
    key: text("key").notNull(),
    originalStorageKeyDeletedAt: timestamp("original_storage_key_deleted_at"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("asset_ownerUserId_idx").on(table.ownerUserId)],
);

export const channel = pgTable(
  "channel",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "no action" }),
    name: text("name").notNull(),
    alias: text("alias").notNull().unique(),
    currentAvatarAssetId: uuid("current_avatar_asset_id").references(
      () => asset.id,
      { onDelete: "no action" },
    ),
    pendingAvatarAssetId: uuid("pending_avatar_asset_id").references(
      () => asset.id,
      { onDelete: "no action" },
    ),
    default: boolean().default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("channel_userId_idx").on(table.userId),
    index("channel_currentAvatarAssetId_idx").on(table.currentAvatarAssetId),
    index("channel_pendingAvatarAssetId_idx").on(table.pendingAvatarAssetId),
  ],
);

// #endregion

export const schema = {
  user,
  session,
  account,
  verification,
  jwks,
  video,
  asset,
  channel,
  videoPlayback,
  videoAttempt,
} as const;

export type Schema = typeof schema;
