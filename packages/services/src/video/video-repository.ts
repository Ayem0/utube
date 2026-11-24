import {
  asset,
  channel,
  video,
  videoAttempt,
  videoPlayback,
} from "@repo/db/schema";
import type {
  Asset,
  Channel,
  Video,
  VideoAttempt,
  VideoInsert,
  VideoPlayback,
} from "@repo/db/types";
import { videoVisibility } from "@repo/types/enums/video/video-visibility";
import type {
  PaginationRequest,
  PaginationResult,
} from "@repo/types/types/pagination";
import {
  and,
  count,
  desc,
  eq,
  exists,
  isNotNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { alias } from "drizzle-orm/pg-core";
import { Context, Effect, Layer, UndefinedOr } from "effect";
import type { SqlError } from "effect/sql/SqlError";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";
import { InvalidMediaTypeError } from "../media/media-errors";
import { newId } from "../utils/id";

type WatchLightVideo = Pick<
  Video,
  "id" | "description" | "title" | "publishedAt" | "duration"
> & {
  channel: Pick<Channel, "alias" | "name"> & Pick<Asset, "variants">;
  playback: Pick<
    VideoPlayback,
    "dashManifestKey" | "hlsMasterKey" | "storyboardKey" | "renditions"
  >;
};

type WatchFullVideo = WatchLightVideo &
  Pick<Video, "visibility"> & { playback: Pick<VideoPlayback, "id"> };

export type StudioLightVideo = Pick<
  Video,
  "id" | "title" | "description" | "visibility" | "duration" | "publishedAt"
> & {
  thumbnail: {
    variants: Asset["variants"];
  } | null;
};

export type StudioFullVideo = Pick<
  Video,
  "id" | "title" | "description" | "visibility" | "duration" | "publishedAt"
> & {
  playback: Pick<
    VideoPlayback,
    "dashManifestKey" | "hlsMasterKey" | "renditions" | "storyboardKey"
  >;
  sourceVideoAsset: Pick<Asset, "status">;
  currentThumbnail: Pick<Asset, "variants" | "status"> | null;
  pendingThumbnail: Pick<Asset, "variants" | "status"> | null;
};

export interface VideoRepositoryService {
  create: (
    params: VideoInsert & { userId: string },
  ) => Effect.Effect<
    Video,
    EffectDrizzleQueryError | DBNotFoundError | SqlError
  >;

  getWatchById: (params: {
    id: string;
    userId?: string;
  }) => Effect.Effect<
    WatchFullVideo,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  canRefreshPlaybackToken: (params: {
    userId?: string;
    videoId: string;
  }) => Effect.Effect<
    { videoId: string; playbackId: string; durationSeconds: number },
    EffectDrizzleQueryError | DBNotFoundError
  >;

  getStudioByChannelId: (
    params: PaginationRequest<{}, {}> & { channelId: string; userId: string },
  ) => Effect.Effect<
    PaginationResult<StudioLightVideo[]>,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  updateStudio: (params: {
    userId: string;
    channelId: string;
    videoId: string;
    data: Pick<Video, "title" | "description" | "visibility">;
  }) => Effect.Effect<
    { id: string },
    DBNotFoundError | InvalidMediaTypeError | EffectDrizzleQueryError
  >;

  getStudioById: (params: {
    userId: string;
    channelId: string;
    videoId: string;
  }) => Effect.Effect<
    StudioFullVideo,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  setPendingThumbnailAssetId: (params: {
    assetId: string;
    userId: string;
    channelId: string;
    videoId: string;
  }) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

  updateCurrentThumbnailAssetIdWithPendingAssetId: (params: {
    videoId: string;
  }) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

  updateInternal: (params: {
    videoId: string;
    values: Partial<
      Pick<
        VideoInsert,
        | "visibility"
        | "currentPlaybackId"
        | "currentThumbnailAssetId"
        | "pendingThumbnailAssetId"
        | "description"
        | "title"
        | "duration"
        | "publishedAt"
      >
    >;
  }) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

  getBySourceVideoAssetId: (params: {
    sourceVideoAssetId: string;
  }) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

  getByCurrentThumbnailAssetId: (params: {
    currentThumbnailAssetId: string;
  }) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

  getVideoAttemptByAssetId: (params: {
    assetId: string;
  }) => Effect.Effect<VideoAttempt, EffectDrizzleQueryError | DBNotFoundError>;
}

export class VideoRepository extends Context.Service<
  VideoRepository,
  VideoRepositoryService
>()("VideoRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const currentThumbnailAsset = alias(asset, "current_thumbnail_asset");
    const pendingThumbnailAsset = alias(asset, "pending_thumbnail_asset");
    const sourceVideoAsset = alias(asset, "source_video_asset");

    return {
      getVideoAttemptByAssetId: ({ assetId }) =>
        db
          .run((cl) =>
            cl
              .select()
              .from(videoAttempt)
              .where(
                and(
                  eq(videoAttempt.assetId, assetId),
                  exists(
                    cl
                      .select()
                      .from(video)
                      .where(
                        and(
                          eq(video.id, videoAttempt.videoId),
                          eq(video.latestAttemptId, videoAttempt.id),
                        ),
                      ),
                  ),
                ),
              ),
          )
          .pipe(
            Effect.flatMap(([res]) =>
              UndefinedOr.match(res, {
                onUndefined: () =>
                  new DBNotFoundError({ message: "Video attempt not found" }),
                onDefined: (res) => Effect.succeed(res),
              }),
            ),
          ),
      updateCurrentThumbnailAssetIdWithPendingAssetId: ({ videoId }) =>
        db.run((db) =>
          db
            .update(video)
            .set({
              currentPlaybackId: video.pendingThumbnailAssetId,
              pendingThumbnailAssetId: null,
            })
            .where(eq(video.id, videoId))
            .returning()
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),
      setPendingThumbnailAssetId: ({ assetId, channelId, userId, videoId }) =>
        db.run((db) =>
          db
            .update(video)
            .set({ pendingThumbnailAssetId: assetId })
            .where(
              and(
                eq(video.id, videoId),
                eq(video.channelId, channelId),
                exists(
                  db
                    .select({ id: channel.id })
                    .from(channel)
                    .where(
                      and(
                        eq(channel.id, channelId),
                        eq(channel.userId, userId),
                      ),
                    )
                    .limit(1),
                ),
              ),
            )
            .returning()
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),
      canRefreshPlaybackToken: ({ videoId, userId }) =>
        db.run((db) =>
          db
            .select({
              videoId: video.id,
              playbackId: videoPlayback.id,
              durationSeconds: video.duration,
            })
            .from(video)
            .innerJoin(
              videoPlayback,
              eq(video.currentPlaybackId, videoPlayback.id),
            )
            .innerJoin(channel, eq(video.channelId, channel.id))
            .where(
              and(
                eq(video.id, videoId),
                isNotNull(video.duration),
                userId
                  ? or(
                      or(
                        eq(video.visibility, videoVisibility.UNLISTED),
                        eq(video.visibility, videoVisibility.PUBLIC),
                      ),
                      and(
                        eq(video.visibility, videoVisibility.PRIVATE),
                        eq(channel.userId, userId),
                      ),
                    )
                  : or(
                      eq(video.visibility, videoVisibility.UNLISTED),
                      eq(video.visibility, videoVisibility.PUBLIC),
                    ),
              ),
            )
            .pipe(
              Effect.flatMap(([row]) =>
                UndefinedOr.match(row, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (row) =>
                    Effect.succeed({
                      ...row,
                      durationSeconds: row.durationSeconds!,
                    }),
                }),
              ),
            ),
        ),

      // TODO later add filters, sort, search
      getStudioByChannelId: ({ channelId, userId, index, size }) =>
        db.run((db) =>
          Effect.gen(function* () {
            const filters = and(
              eq(video.channelId, channelId),
              eq(channel.userId, userId),
            );

            const total = yield* db
              .select({
                total: count(),
              })
              .from(video)
              .innerJoin(channel, eq(video.channelId, channel.id))
              .where(filters)
              .pipe(Effect.map(([row]) => row?.total ?? 0));

            if (total === 0)
              return {
                index: 0,
                size: size,
                totalResults: total,
                items: [],
                maxPageIndex: 0,
              };

            const maxPageIndex = Math.ceil(total / size) - 1;
            const normalizedIndex =
              index > maxPageIndex || index < 0 ? 0 : index;

            const rows = yield* db
              .select({
                id: video.id,
                title: video.title,
                description: video.description,
                visibility: video.visibility,
                duration: video.duration,
                createdAt: video.createdAt,
                publishedAt: video.publishedAt,
                thumbnail: {
                  variants: asset.variants,
                },
              })
              .from(video)
              .innerJoin(channel, eq(video.channelId, channel.id))
              .leftJoin(asset, eq(video.currentThumbnailAssetId, asset.id))
              .where(filters)
              .offset(normalizedIndex * size)
              .limit(size)
              .orderBy(desc(video.createdAt));

            return {
              index: normalizedIndex,
              size: size,
              totalResults: total,
              items: rows,
              maxPageIndex: maxPageIndex,
            };
          }),
        ),

      getWatchById: ({ id, userId }) =>
        db.run((db) =>
          db
            .select({
              id: video.id,
              description: video.description,
              publishedAt: video.publishedAt,
              title: video.title,
              duration: video.duration,
              visibility: video.visibility,
              channel: {
                name: channel.name,
                alias: channel.alias,
                currentAvatarAssetId: channel.currentAvatarAssetId,
                variants: asset.variants,
              },
              playback: {
                id: videoPlayback.id,
                dashManifestKey: videoPlayback.dashManifestKey,
                hlsMasterKey: videoPlayback.hlsMasterKey,
                storyboardKey: videoPlayback.storyboardKey,
                renditions: videoPlayback.renditions,
              },
            })
            .from(video)
            .innerJoin(
              videoPlayback,
              eq(video.currentPlaybackId, videoPlayback.id),
            )
            .innerJoin(channel, eq(video.channelId, channel.id))
            .leftJoin(asset, eq(channel.currentAvatarAssetId, asset.id))
            .where(
              and(
                eq(video.id, id),
                isNotNull(video.duration),
                userId
                  ? or(
                      or(
                        eq(video.visibility, videoVisibility.UNLISTED),
                        eq(video.visibility, videoVisibility.PUBLIC),
                      ),
                      and(
                        eq(video.visibility, videoVisibility.PRIVATE),
                        eq(channel.userId, userId),
                      ),
                    )
                  : or(
                      eq(video.visibility, videoVisibility.UNLISTED),
                      eq(video.visibility, videoVisibility.PUBLIC),
                    ),
              ),
            )
            .pipe(
              Effect.flatMap(([row]) =>
                UndefinedOr.match(row, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (row) => Effect.succeed(row),
                }),
              ),
            ),
        ),

      updateStudio: ({ userId, channelId, videoId, data }) =>
        db.run((db) =>
          db
            .update(video)
            .set({
              title: data.title,
              description: data.description,
              visibility: data.visibility,
              publishedAt:
                data.visibility !== videoVisibility.DRAFT
                  ? sql<Date>`coalesce(${video.publishedAt}, now())`
                  : undefined,
            })
            .where(
              and(
                eq(video.id, videoId),
                eq(video.channelId, channelId),
                exists(
                  db
                    .select({ id: channel.id })
                    .from(channel)
                    .where(
                      and(
                        eq(channel.id, channelId),
                        eq(channel.userId, userId),
                      ),
                    )
                    .limit(1),
                ),
              ),
            )
            .returning({ id: video.id })
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),

      updateInternal: ({ videoId, values }) =>
        db.run((db) =>
          db
            .update(video)
            .set(values)
            .where(and(eq(video.id, videoId)))
            .returning()
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),
      create: Effect.fn(function* (input) {
        const param = <T>(value: T) => sql<T>`${value}`;

        const fields = {
          id: param<VideoInsert["id"]>(input.id).as("id"),
          channelId: channel.id,
          sourceVideoAssetId: param<VideoInsert["sourceVideoAssetId"]>(
            input.sourceVideoAssetId,
          ).as("sourceVideoAssetId"),
          title: param<VideoInsert["title"]>(input.title).as("title"),
          description: param<VideoInsert["description"]>(
            input.description ?? null,
          ).as("description"),
        } satisfies {
          id: SQL.Aliased<VideoInsert["id"]>;
          channelId: typeof channel.id;
          sourceVideoAssetId: SQL.Aliased<VideoInsert["sourceVideoAssetId"]>;
          title: SQL.Aliased<VideoInsert["title"]>;
          description: SQL.Aliased<VideoInsert["description"]>;
        };
        const [videoRow] = yield* db.run((cl) =>
          cl
            .insert(video)
            .select(
              cl
                .select(fields)
                .from(channel)
                .where(
                  and(
                    eq(channel.id, input.channelId),
                    eq(channel.userId, input.userId),
                  ),
                ),
            )
            .returning(),
        );

        if (!videoRow) {
          return yield* new DBNotFoundError({ message: "Video not created" });
        }

        const [videoAttemptRow] = yield* db.run((cl) =>
          cl
            .insert(videoAttempt)
            .values({
              assetId: input.sourceVideoAssetId,
              id: newId(),
              videoId: videoRow.id,
            })
            .returning(),
        );

        if (!videoAttemptRow) {
          return yield* new DBNotFoundError({
            message: "Video attempt not created",
          });
        }
        const [updatedVideo] = yield* db.run((cl) =>
          cl
            .update(video)
            .set({ latestAttemptId: videoAttemptRow.id })
            .where(eq(video.id, videoRow.id))
            .returning(),
        );

        if (!updatedVideo) {
          return yield* new DBNotFoundError({
            message: "Video not updated",
          });
        }
        return updatedVideo;
      }, db.withTransaction),

      getBySourceVideoAssetId: ({ sourceVideoAssetId }) =>
        db.run((db) =>
          db
            .select()
            .from(video)
            .where(eq(video.sourceVideoAssetId, sourceVideoAssetId))
            .limit(1)
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),

      getByCurrentThumbnailAssetId: ({ currentThumbnailAssetId }) =>
        db.run((db) =>
          db
            .select()
            .from(video)
            .where(eq(video.currentThumbnailAssetId, currentThumbnailAssetId))
            .limit(1)
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),

      getStudioById: ({ userId, channelId, videoId }) =>
        db.run((db) =>
          db
            .select({
              id: video.id,
              title: video.title,
              description: video.description,
              visibility: video.visibility,
              duration: video.duration,
              publishedAt: video.publishedAt,
              sourceVideoAsset: {
                status: sourceVideoAsset.status,
              },
              currentThumbnail: {
                variants: currentThumbnailAsset.variants,
                status: currentThumbnailAsset.status,
              },
              pendingThumbnail: {
                variants: pendingThumbnailAsset.variants,
                status: pendingThumbnailAsset.status,
              },
              playback: {
                dashManifestKey: videoPlayback.dashManifestKey,
                hlsMasterKey: videoPlayback.hlsMasterKey,
                storyboardKey: videoPlayback.storyboardKey,
                renditions: videoPlayback.renditions,
              },
            })
            .from(video)
            .innerJoin(channel, eq(video.channelId, channel.id))
            .leftJoin(
              currentThumbnailAsset,
              eq(video.currentThumbnailAssetId, currentThumbnailAsset.id),
            )
            .leftJoin(
              pendingThumbnailAsset,
              eq(video.pendingThumbnailAssetId, pendingThumbnailAsset.id),
            )
            .leftJoin(
              videoPlayback,
              eq(video.currentPlaybackId, videoPlayback.id),
            )
            .innerJoin(
              sourceVideoAsset,
              eq(video.sourceVideoAssetId, sourceVideoAsset.id),
            )
            .where(
              and(
                eq(video.id, videoId),
                eq(channel.userId, userId),
                eq(channel.id, channelId),
              ),
            )
            .limit(1)
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Video not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(DB.Layer),
  );
}
