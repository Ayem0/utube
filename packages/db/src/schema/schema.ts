import { AssetStatus } from "@repo/types/enums/asset/asset-status";
import { VideoCreationStatus } from "@repo/types/enums/video/video-status";
import { VideoVisibility } from "@repo/types/enums/video/video-visibility";
import {
  boolean,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
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
    id: uuid("id").defaultRandom().primaryKey(),
    channelId: text("channel_id")
      .notNull()
      .references(() => channel.id, { onDelete: "no action" }),
    title: text("title").notNull(),
    description: text("description"),
    visibility: smallint("visibility").notNull().default(VideoVisibility.DRAFT),
    hlsUrl: text("hls_url"),
    dashUrl: text("dash_url"),
    thumbnailUrl: text("thumbnail_url"),
    storyboardUrl: text("storyboard_url"),
    duration: numeric("duration", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    publishedAt: timestamp("published_at"),
    creationStatus: smallint("creation_status")
      .notNull()
      .default(VideoCreationStatus.UPLOADING),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("video_channelId_idx").on(table.channelId)],
);

export const asset = pgTable(
  "asset",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => video.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: numeric("size_bytes", { mode: "number" }).notNull(),
    type: smallint("type").notNull(),
    status: smallint("status").notNull().default(AssetStatus.PENDING),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    key: text("key").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("asset_videoId_idx").on(table.videoId)],
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
    avatarUrl: text("avatar_url"),
    default: boolean().default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("channel_userId_idx").on(table.userId)],
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
} as const;

export type Schema = typeof schema;
