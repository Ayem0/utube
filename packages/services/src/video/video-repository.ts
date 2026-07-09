import {
  asset,
  channel as channelTable,
  video,
  videoPlayback,
  video as videoTable,
} from "@repo/db/schema";
import type {
  Asset,
  Channel,
  Video,
  VideoInsert,
  VideoPlayback,
} from "@repo/db/types";
import { videoVisibility } from "@repo/types/enums/video/video-visibility";
import { PaginationResult } from "@repo/types/types/pagination";
import { and, eq, exists, isNotNull, or } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import { DB, repoFn, type RepoFn } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";
import { InvalidMediaTypeError } from "../media/media-errors";

type WatchVideo = Pick<
  Video,
  "id" | "description" | "title" | "publishedAt" | "duration" | "visibility"
> & {
  channel: Pick<Channel, "alias" | "name"> & Pick<Asset, "variants">;
  playback: Pick<
    VideoPlayback,
    "dashManifestKey" | "hlsMasterKey" | "storyboardKey" | "renditions"
  >;
};

export type StudioVideo = Pick<
  Video,
  | "id"
  | "title"
  | "description"
  | "visibility"
  | "duration"
  | "createdAt"
  | "publishedAt"
>;

type PublicLightVideo = Pick<
  Video,
  "id" | "title" | "duration" | "publishedAt"
> & { channel: Pick<Channel, "alias" | "currentAvatarAssetId" | "name"> };

type PublicFullVideo = PublicLightVideo & Pick<Video, "description">;

const publicLightVideo = {
  id: videoTable.id,
  title: videoTable.title,
  duration: videoTable.duration,
  publishedAt: videoTable.publishedAt,
  channel: {
    name: channelTable.name,
    alias: channelTable.alias,
    currentAvatarAssetId: channelTable.currentAvatarAssetId,
  },
} as const;

const publicFullVideo = {
  ...publicLightVideo,
  description: videoTable.description,
} as const;

const studioVideo = {
  id: videoTable.id,
  title: videoTable.title,
  description: videoTable.description,
  visibility: videoTable.visibility,
  duration: videoTable.duration,
  createdAt: videoTable.createdAt,
  publishedAt: videoTable.publishedAt,
} as const;

export interface VideoRepositoryService {
  // createStudio: (params: {
  //   userId: string;
  //   channelId: string;
  //   data: Pick<Video, "title"> &
  //     Pick<Asset, "filename" | "mimeType" | "sizeBytes" | "type">;
  // }) => Effect.Effect<
  //   { video: Video; asset: Asset },
  //   DBNotFoundError | InvalidMediaTypeError | EffectDrizzleQueryError
  // >;

  create: RepoFn<VideoInsert, Video, EffectDrizzleQueryError | DBNotFoundError>;

  getWatchById: RepoFn<
    { id: string },
    WatchVideo,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  updateStudio: (params: {
    userId: string;
    channelId: string;
    videoId: string;
    data: Pick<Video, "title" | "description" | "visibility">;
  }) => Effect.Effect<
    StudioVideo,
    DBNotFoundError | InvalidMediaTypeError | EffectDrizzleQueryError
  >;

  updateInternal: RepoFn<
    {
      videoId: string;
      data: Partial<Video>;
    },
    Video,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  // getByIdJoinVideoAsset: (
  //   videoId: string,
  // ) => Effect.Effect<
  //   Video & { asset: Asset },
  //   EffectDrizzleQueryError | DBNotFoundError
  // >;

  deleteStudio: (params: {
    userId: string;
    channelId: string;
    videoId: string;
  }) => Effect.Effect<
    { id: string },
    EffectDrizzleQueryError | DBNotFoundError
  >;

  getPublicByChannelId: (params: {
    channelId: string;
    index: number;
    size: number;
  }) => Effect.Effect<
    PaginationResult<PublicLightVideo[]>,
    EffectDrizzleQueryError
  >;

  getPublicById: (
    id: string,
  ) => Effect.Effect<
    PublicFullVideo,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  getStudioByChannelId: (params: {
    userId: string;
    channelId: string;
    index: number;
    size: number;
  }) => Effect.Effect<
    PaginationResult<StudioVideo[]>,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  getStudioById: (params: {
    userId: string;
    channelId: string;
    videoId: string;
  }) => Effect.Effect<StudioVideo, EffectDrizzleQueryError | DBNotFoundError>;

  getBySourceVideoAssetId: (
    sourceVideoAssetId: string,
  ) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

  getByCurrentThumbnailAssetId: (
    currentThumbnailAssetId: string,
  ) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;
}

export class VideoRepository extends Context.Service<
  VideoRepository,
  VideoRepositoryService
>()("VideoRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;
    return {
      getWatchById: repoFn(
        ({ id }, db) =>
          Effect.gen(function* () {
            const [row] = yield* db
              .select({
                id: video.id,
                description: video.description,
                publishedAt: video.publishedAt,
                title: video.title,
                duration: video.duration,
                visibility: video.visibility,
                channel: {
                  name: channelTable.name,
                  alias: channelTable.alias,
                  currentAvatarAssetId: channelTable.currentAvatarAssetId,
                  variants: asset.variants,
                },
                playback: {
                  dashManifestKey: videoPlayback.dashManifestKey,
                  hlsMasterKey: videoPlayback.hlsMasterKey,
                  storyboardKey: videoPlayback.storyboardKey,
                  renditions: videoPlayback.renditions,
                },
              })
              .from(video)
              .innerJoin(videoPlayback, eq(video.id, videoPlayback.videoId))
              .innerJoin(channelTable, eq(video.channelId, channelTable.id))
              .innerJoin(asset, eq(channelTable.currentAvatarAssetId, asset.id))
              .where(
                and(
                  eq(video.id, id),
                  or(
                    eq(video.visibility, videoVisibility.UNLISTED),
                    eq(video.visibility, videoVisibility.PUBLIC),
                  ),
                ),
              );

            if (!row)
              return yield* new DBNotFoundError({ message: "Video not found" });

            return row;
          }),
        db,
      ),

      updateStudio: ({ userId, channelId, videoId, data }) =>
        Effect.gen(function* () {
          const isPublished = data.visibility !== videoVisibility.DRAFT;
          const [updateded] = yield* db
            .update(videoTable)
            .set({
              title: data.title,
              description: data.description,
              visibility: data.visibility,
              publishedAt: isPublished ? new Date() : null,
            })
            .where(
              and(
                eq(videoTable.id, videoId),
                eq(videoTable.channelId, channelId),
                exists(
                  db
                    .select({ id: channelTable.id })
                    .from(channelTable)
                    .where(
                      and(
                        eq(channelTable.id, channelId),
                        eq(channelTable.userId, userId),
                      ),
                    )
                    .limit(1),
                ),
              ),
            )
            .returning(studioVideo);

          if (!updateded)
            return yield* new DBNotFoundError({
              message: "Video not found or unauthorize to update",
            });

          return updateded;
        }),

      deleteStudio: ({ userId, channelId, videoId }) =>
        Effect.gen(function* () {
          const deleted = yield* db
            .delete(videoTable)
            .where(
              and(
                eq(videoTable.id, videoId),
                eq(videoTable.channelId, channelId),
                exists(
                  db
                    .select({ id: channelTable.id })
                    .from(channelTable)
                    .where(
                      and(
                        eq(channelTable.id, channelId),
                        eq(channelTable.userId, userId),
                      ),
                    )
                    .limit(1),
                ),
              ),
            )
            .returning({ id: videoTable.id });

          if (deleted.length > 0) return deleted[0]!;

          return yield* new DBNotFoundError({
            message: "Video not found",
          });
        }),

      getPublicByChannelId: ({ channelId, index, size }) =>
        Effect.gen(function* () {
          const publicVideoFilter = and(
            eq(videoTable.channelId, channelId),
            eq(videoTable.visibility, videoVisibility.PUBLIC),
            isNotNull(videoTable.publishedAt),
          );
          const count = yield* db.$count(videoTable, publicVideoFilter);

          if (count === 0)
            return {
              pageIndex: 0,
              pageSize: size,
              totalResults: count,
              items: [],
              maxPageIndex: 0,
            };

          const maxPageIndex = Math.ceil(count / size) - 1;

          if (index > maxPageIndex || index < 0) {
            index = 0;
          }

          const rows = yield* db
            .select(publicLightVideo)
            .from(videoTable)
            .where(publicVideoFilter)
            .innerJoin(channelTable, eq(videoTable.channelId, channelTable.id))
            .offset(index * size)
            .limit(size);

          return {
            pageIndex: index,
            pageSize: size,
            totalResults: count,
            items: rows,
            maxPageIndex: maxPageIndex,
          };
        }),

      updateInternal: repoFn(
        ({ videoId, data }, db) =>
          Effect.gen(function* () {
            const [updated] = yield* db
              .update(videoTable)
              .set(data)
              .where(and(eq(videoTable.id, videoId)))
              .returning();

            if (!updated)
              return yield* new DBNotFoundError({
                message: "Video not updated",
              });

            return updated;
          }),
        db,
      ),

      getPublicById: (id) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .select(publicFullVideo)
            .from(videoTable)
            .innerJoin(channelTable, eq(videoTable.channelId, channelTable.id))
            .where(
              and(
                eq(videoTable.id, id),
                or(
                  eq(videoTable.visibility, videoVisibility.PUBLIC),
                  eq(videoTable.visibility, videoVisibility.UNLISTED),
                ),
                isNotNull(videoTable.publishedAt),
              ),
            )
            .limit(1);

          if (!row)
            return yield* new DBNotFoundError({ message: "Video not found" });
          return row;
        }),

      getStudioByChannelId: ({ userId, channelId, index, size }) =>
        Effect.gen(function* () {
          const count = yield* db.$count(
            videoTable,
            and(
              eq(videoTable.channelId, channelId),
              exists(
                db
                  .select({ id: channelTable.id })
                  .from(channelTable)
                  .where(
                    and(
                      eq(channelTable.id, channelId),
                      eq(channelTable.userId, userId),
                    ),
                  ),
              ),
            ),
          );

          if (count === 0)
            return {
              pageIndex: 0,
              pageSize: size,
              totalResults: count,
              items: [],
              maxPageIndex: 0,
            };

          const maxPageIndex = Math.ceil(count / size) - 1;

          if (index > maxPageIndex || index < 0) {
            index = 0;
          }

          const rows = yield* db
            .select(studioVideo)
            .from(videoTable)
            .innerJoin(channelTable, eq(videoTable.channelId, channelTable.id))
            .where(
              and(
                eq(channelTable.id, channelId),
                eq(channelTable.userId, userId),
              ),
            )
            .offset(index * size)
            .limit(size);

          return {
            pageIndex: index,
            pageSize: size,
            totalResults: count,
            items: rows,
            maxPageIndex: maxPageIndex,
          };
        }),

      getStudioById: ({ userId, channelId, videoId }) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .select(studioVideo)
            .from(videoTable)
            .innerJoin(channelTable, eq(videoTable.channelId, channelTable.id))
            .where(
              and(
                eq(channelTable.id, channelId),
                eq(videoTable.id, videoId),
                eq(channelTable.userId, userId),
              ),
            )
            .limit(1);

          if (!row)
            return yield* new DBNotFoundError({
              message: "Video not found or unauthorize to access",
            });
          return row;
        }),

      getBySourceVideoAssetId: (sourceVideoAssetId) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .select()
            .from(videoTable)
            .where(eq(videoTable.sourceVideoAssetId, sourceVideoAssetId))
            .limit(1);

          if (!row)
            return yield* new DBNotFoundError({
              message: "Video not found",
            });
          return row;
        }),

      getByCurrentThumbnailAssetId: (currentThumbnailAssetId) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .select()
            .from(videoTable)
            .where(
              eq(videoTable.currentThumbnailAssetId, currentThumbnailAssetId),
            )
            .limit(1);

          if (!row)
            return yield* new DBNotFoundError({
              message: "Video not found",
            });
          return row;
        }),

      create: repoFn(
        (input, db) =>
          Effect.gen(function* () {
            const [row] = yield* db
              .insert(videoTable)
              .values(input)
              .returning();
            if (!row)
              return yield* new DBNotFoundError({
                message: "Video not found",
              });
            return row;
          }),
        db,
      ),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(DB.Layer),
  );
}
// createStudio: ({ userId, channelId, data }) =>
//   Effect.gen(function* () {
//     const extension = getVideoExtensionFromMimeType(data.mimeType);
//     if (!extension) {
//       return yield* new InvalidMediaTypeError({
//         message: "Error invalid file",
//       });
//     }

//     const [result] = yield* db.execute<{
//       video: Video;
//       asset: Asset;
//     }>(sql`
//       WITH created_video AS (
//         INSERT INTO video (
//           channel_id,
//           title
//         )
//         SELECT
//           c.id,
//           ${data.title}
//         FROM channel AS c
//         WHERE c.id = ${channelId}
//           AND c.user_id = ${userId}
//         LIMIT 1
//         RETURNING *
//       ),

//       created_asset AS (
//         INSERT INTO asset (
//           video_id,
//           filename,
//           mime_type,
//           size_bytes,
//           type,
//           key
//         )
//         SELECT
//           v.id,
//           ${data.filename},
//           ${data.mimeType},
//           ${data.sizeBytes},
//           ${data.type},
//           concat(v.id, '/original.', ${extension}::text)
//         FROM created_video AS v
//         RETURNING *
//       )

//       SELECT
//         row_to_json(created_video) AS video,
//         row_to_json(created_asset) AS asset
//       FROM created_video
//       INNER JOIN created_asset
//         ON created_asset.video_id = created_video.id;
//     `);

//     if (!result)
//       return yield* new DBNotFoundError({
//         message: "Channel not found or unauthorize to create video",
//       });

//     return result;
//   }),

//  getByIdJoinVideoAsset: (videoId) =>
//   Effect.gen(function* () {
//     const [row] = yield* db
//       .select()
//       .from(videoTable)
//       .innerJoin(assetTable, eq(videoTable.id, assetTable.videoId))
//       .where(
//         and(
//           eq(videoTable.id, videoId),
//           eq(assetTable.type, assetType.VIDEO),
//         ),
//       )
//       .limit(1);

//     if (!row)
//       return yield* new DBNotFoundError({
//         message: "Video not found",
//       });
//     return {
//       ...row.video,
//       asset: row.asset,
//     };
//   }),
