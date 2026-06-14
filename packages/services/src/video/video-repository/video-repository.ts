import {
  asset as assetTable,
  channel as channelTable,
  video as videoTable,
} from "@repo/db/schema";
import type { Asset, Channel, Video } from "@repo/db/types";
import { VideoVisibility } from "@repo/types/enums/video/video-visibility";
import { PaginationResult } from "@repo/types/types/pagination";
import { and, eq, exists } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import type { SqlError } from "effect/unstable/sql/SqlError";
import { DB } from "../../db/db-client";
import { DBError, DBNotFoundError } from "../../db/db-errors";
import { InvalidMediaFileNameError } from "../../media/media-errors";

export class VideoRepository extends Context.Service<
  VideoRepository,
  VideoRepositoryService
>()("VideoRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;
    return {
      create: (userId, channelId, data) =>
        Effect.gen(function* () {
          const extension = data.filename.split(".").pop();

          if (!extension) {
            return yield* new InvalidMediaFileNameError({
              message: "Error invalid file name : " + data.filename,
            });
          }

          // TODO make this not a transaction but one query, ignore Unauthorized error
          const res = yield* db.transaction((tx) =>
            Effect.gen(function* () {
              // const [selectedChannel] = yield* tx
              //   .select()
              //   .from(channelTable)
              //   .where(
              //     and(
              //       eq(channelTable.userId, userId),
              //       eq(channelTable.id, channelId),
              //     ),
              //   );

              // if (!selectedChannel) {
              //   return yield* new UnauthorizedError({
              //     message: "Unauthorized",
              //   });
              // }

              const [createdVideo] = yield* tx
                .insert(videoTable)
                .values({
                  channelId: channelId,
                  title: data.title,
                })
                .returning();

              if (!createdVideo) {
                return yield* new DBError({
                  message: "Error in creating video ",
                  cause: "Row not created at insert query",
                });
              }

              const [createdAsset] = yield* tx
                .insert(assetTable)
                .values({
                  key: `videos/${createdVideo.channelId}/${createdVideo.id}/original.${extension}`,
                  videoId: createdVideo.id,
                  filename: data.filename,
                  mimeType: data.mimeType,
                  sizeBytes: data.sizeBytes,
                  type: data.type,
                })
                .returning();

              if (!createdAsset) {
                return yield* new DBError({
                  message: "Error in creating video ",
                  cause: "Row not created at insert query",
                });
              }

              return { video: createdVideo, asset: createdAsset };
            }),
          );

          return res;
        }),

      delete: (userId, channelId, videoId) =>
        Effect.gen(function* () {
          const deleted = yield* db
            .delete(videoTable)
            .where(
              and(
                eq(videoTable.id, videoId),
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

      getByChannelId: (channelId, index, size) =>
        Effect.gen(function* () {
          const count = yield* db.$count(
            videoTable,
            eq(videoTable.channelId, channelId),
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

          if (index < maxPageIndex) {
            index = 0;
          }

          const rows = yield* db
            .select()
            .from(videoTable)
            .where(
              and(
                eq(videoTable.channelId, channelId),
                eq(videoTable.visibility, VideoVisibility.PUBLIC),
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

      update: (userId, channelId, videoId, data) =>
        Effect.gen(function* () {
          const [updated] = yield* db
            .update(videoTable)
            .set(data)
            .where(
              and(
                eq(videoTable.id, videoId),
                exists(
                  db
                    .select({ id: channelTable.id })
                    .from(channelTable)
                    .where(
                      and(
                        eq(channelTable.userId, userId),
                        eq(channelTable.id, channelId),
                      ),
                    ),
                ),
              ),
            )
            .returning();

          if (!updated)
            return yield* new DBNotFoundError({ message: "Video not updated" });
          return updated;
        }),

      getById: (id) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .select({
              id: videoTable.id,
              title: videoTable.title,
              description: videoTable.description,
              visibility: videoTable.visibility,
              dashUrl: videoTable.dashUrl,
              hlsUrl: videoTable.hlsUrl,
              thumbnailUrl: videoTable.thumbnailUrl,
              storyboardUrl: videoTable.storyboardUrl,
              duration: videoTable.duration,
              publishedAt: videoTable.publishedAt,

              channel: {
                name: channelTable.name,
                alias: channelTable.alias,
                avatarUrl: channelTable.avatarUrl,
              },
            })
            .from(videoTable)
            .innerJoin(channelTable, eq(videoTable.channelId, channelTable.id))
            .where(eq(videoTable.id, id))
            .limit(1);

          if (!row)
            return yield* new DBNotFoundError({ message: "Video not found" });
          return row;
        }),

      getStudioByChannelId: (userId, channelId, index, size) =>
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
                      eq(channelTable.userId, userId),
                      eq(channelTable.id, channelId),
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

          if (index < maxPageIndex) {
            index = 0;
          }

          const rows = yield* db
            .select({
              id: videoTable.id,
              title: videoTable.title,
              description: videoTable.description,
              visibility: videoTable.visibility,
              dashUrl: videoTable.dashUrl,
              hlsUrl: videoTable.hlsUrl,
              thumbnailUrl: videoTable.thumbnailUrl,
              storyboardUrl: videoTable.storyboardUrl,
              creationStatus: videoTable.creationStatus,
              duration: videoTable.duration,
              createdAt: videoTable.createdAt,
              updatedAt: videoTable.updatedAt,
              publishedAt: videoTable.publishedAt,
            })
            .from(videoTable)
            .where(and(eq(videoTable.channelId, channelId)))
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
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(DB.Layer),
  );
}

export interface VideoRepositoryService {
  create: (
    userId: string,
    channelId: string,
    data: Pick<Video, "title"> &
      Pick<Asset, "filename" | "mimeType" | "sizeBytes" | "type">,
  ) => Effect.Effect<
    { video: Video; asset: Asset },
    | DBNotFoundError
    | SqlError
    | InvalidMediaFileNameError
    | DBError
    | EffectDrizzleQueryError
  >;

  update: (
    userId: string,
    channelId: string,
    videoId: string,
    data: Partial<Video>,
  ) => Effect.Effect<Video, EffectDrizzleQueryError | DBNotFoundError>;

  delete: (
    userId: string,
    channelId: string,
    videoId: string,
  ) => Effect.Effect<{ id: string }, EffectDrizzleQueryError | DBNotFoundError>;

  getByChannelId: (
    channelId: string,
    index: number,
    size: number,
  ) => Effect.Effect<PaginationResult<Video[]>, EffectDrizzleQueryError>;

  getById: (
    id: string,
  ) => Effect.Effect<
    Pick<
      Video,
      | "id"
      | "title"
      | "description"
      | "visibility"
      | "dashUrl"
      | "hlsUrl"
      | "thumbnailUrl"
      | "storyboardUrl"
      | "duration"
      | "publishedAt"
    > & { channel: Pick<Channel, "name" | "alias" | "avatarUrl"> },
    EffectDrizzleQueryError | DBNotFoundError
  >;

  getStudioByChannelId: (
    userId: string,
    channelId: string,
    index: number,
    size: number,
  ) => Effect.Effect<
    PaginationResult<
      Pick<
        Video,
        | "id"
        | "title"
        | "description"
        | "visibility"
        | "dashUrl"
        | "hlsUrl"
        | "thumbnailUrl"
        | "storyboardUrl"
        | "creationStatus"
        | "duration"
        | "createdAt"
        | "updatedAt"
        | "publishedAt"
      >[]
    >,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  // getStudioById: (
  //   id: string,
  // ) => Effect.Effect<Video, DBError | DBNotFoundError>;
}
