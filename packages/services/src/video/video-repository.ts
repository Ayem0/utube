import { asset, channel, video, videoPlayback } from "@repo/db/schema";
import type {
  Asset,
  Channel,
  Video,
  VideoInsert,
  VideoPlayback,
} from "@repo/db/types";
import { videoPlaybackStatus } from "@repo/types/enums/video/video-playback-status";
import { videoVisibility } from "@repo/types/enums/video/video-visibility";
import type {
  PaginationRequest,
  PaginationResult,
} from "@repo/types/types/pagination";
import { and, count, desc, eq, exists, isNotNull, or, sql } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { alias } from "drizzle-orm/pg-core";
import { Context, Effect, Layer, UndefinedOr } from "effect";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";
import { InvalidMediaTypeError } from "../media/media-errors";

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

const watchLightVideo = {
  id: video.id,
  title: video.title,
  description: video.description,
  publishedAt: video.publishedAt,
  duration: video.duration,
  channel: {
    name: channel.name,
    alias: channel.alias,
    variants: asset.variants,
  },
  playback: {
    dashManifestKey: videoPlayback.dashManifestKey,
    hlsMasterKey: videoPlayback.hlsMasterKey,
    storyboardKey: videoPlayback.storyboardKey,
    renditions: videoPlayback.renditions,
  },
} as const;

export type StudioLightVideo = Pick<
  Video,
  "id" | "title" | "description" | "visibility" | "duration" | "publishedAt"
> & {
  thumbnail: {
    variants: Asset["variants"];
  } | null;
};

const studioLightVideo = {
  id: video.id,
  title: video.title,
  description: video.description,
  visibility: video.visibility,
  duration: video.duration,
  publishedAt: video.publishedAt,
  thumbnail: {
    variants: asset.variants,
  },
} as const;

export type StudioFullVideo = Pick<
  Video,
  "id" | "title" | "description" | "visibility" | "duration" | "publishedAt"
> & {
  playback: Pick<
    VideoPlayback,
    | "dashManifestKey"
    | "hlsMasterKey"
    | "renditions"
    | "status"
    | "storyboardKey"
  > | null;
  sourceVideoAsset: Pick<Asset, "status">;
  currentThumbnail: Pick<Asset, "variants" | "status"> | null;
  pendingThumbnail: Pick<Asset, "variants" | "status"> | null;
};

const studioFullVideo = {
  ...studioLightVideo,
  playback: {
    dashManifestKey: videoPlayback.dashManifestKey,
    hlsMasterKey: videoPlayback.hlsMasterKey,
    storyboardKey: videoPlayback.storyboardKey,
    renditions: videoPlayback.renditions,
    status: videoPlayback.status,
  },
} as const;

export interface VideoRepositoryService {
  create: (
    params: VideoInsert,
  ) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

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

  // deleteStudio: (params: {
  //   userId: string;
  //   channelId: string;
  //   videoId: string;
  // }) => Effect.Effect<
  //   { id: string },
  //   EffectDrizzleQueryError | DBNotFoundError
  // >;

  // getPublicByChannelId: (params: {
  //   channelId: string;
  //   index: number;
  //   size: number;
  // }) => Effect.Effect<
  //   PaginationResult<PublicLightVideo[]>,
  //   EffectDrizzleQueryError
  // >;

  // getPublicById: (
  //   id: string,
  // ) => Effect.Effect<
  //   PublicFullVideo,
  //   EffectDrizzleQueryError | DBNotFoundError
  // >;

  // getStudioByChannelId: (params: {
  //   userId: string;
  //   channelId: string;
  //   index: number;
  //   size: number;
  // }) => Effect.Effect<
  //   PaginationResult<StudioVideo[]>,
  //   EffectDrizzleQueryError | DBNotFoundError
  // >;

  // getStudioById: (params: {
  //   userId: string;
  //   channelId: string;
  //   videoId: string;
  // }) => Effect.Effect<StudioVideo, EffectDrizzleQueryError | DBNotFoundError>;

  getBySourceVideoAssetId: (params: {
    sourceVideoAssetId: string;
  }) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

  getByCurrentThumbnailAssetId: (params: {
    currentThumbnailAssetId: string;
  }) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;
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
      canRefreshPlaybackToken: ({ videoId, userId }) =>
        db.run((db) =>
          db
            .select({
              videoId: video.id,
              playbackId: videoPlayback.id,
              durationSeconds: video.duration,
            })
            .from(video)
            .innerJoin(videoPlayback, eq(video.id, videoPlayback.videoId))
            .innerJoin(channel, eq(video.channelId, channel.id))
            .where(
              and(
                eq(video.id, videoId),
                eq(videoPlayback.status, videoPlaybackStatus.READY),
                isNotNull(video.duration),
                isNotNull(videoPlayback.hlsMasterKey),
                isNotNull(videoPlayback.dashManifestKey),
                isNotNull(videoPlayback.storyboardKey),
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

            const rowsStartTime = performance.now();

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
            .innerJoin(videoPlayback, eq(video.id, videoPlayback.videoId))
            .innerJoin(channel, eq(video.channelId, channel.id))
            .leftJoin(asset, eq(channel.currentAvatarAssetId, asset.id))
            .where(
              and(
                eq(video.id, id),
                eq(videoPlayback.status, videoPlaybackStatus.READY),
                isNotNull(video.duration),
                isNotNull(videoPlayback.hlsMasterKey),
                isNotNull(videoPlayback.dashManifestKey),
                isNotNull(videoPlayback.storyboardKey),
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

      create: (input) =>
        db.run((db) =>
          db
            .insert(video)
            .values(input)
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
                status: videoPlayback.status,
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
