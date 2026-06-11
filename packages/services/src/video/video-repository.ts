import {
  asset as assetTable,
  channel as channelTable,
  video as videoTable,
} from "@repo/db/schema";
import type { Asset, Video } from "@repo/db/types";
import { VideoVisibility } from "@repo/types/enums/video/video-visibility";
import { PaginationResult } from "@repo/types/types/pagination";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DBClient } from "../db/db-client";
import { DBError, DBNotFoundError } from "../db/db-errors";
import { InvalidMediaFileNameError } from "../media/media-errors";

export class VideoRepository extends Context.Tag("VideoRepository")<
  VideoRepository,
  VideoRepositoryService
>() {}

export interface VideoRepositoryService {
  update: (
    id: string,
    data: Partial<Video>,
  ) => Effect.Effect<Video, DBNotFoundError | DBError>;

  create: (
    data: Pick<Video, "channelId" | "title"> &
      Pick<Asset, "filename" | "mimeType" | "sizeBytes" | "type">,
  ) => Effect.Effect<
    { video: Video; asset: Asset },
    DBNotFoundError | DBError | InvalidMediaFileNameError
  >;
  delete: (id: string) => Effect.Effect<void, DBError>;
  getStudioVideosByChannelId: (
    channelId: string,
    userId: string,
    index: number,
    size: number,
  ) => Effect.Effect<PaginationResult<Video[]>, DBError | DBNotFoundError>;
  getById: (id: string) => ReturnType<typeof getById>;
}

export const VideoRepositoryLive = Layer.effect(
  VideoRepository,
  Effect.gen(function* () {
    const db = yield* DBClient;
    return {
      getStudioVideosByChannelId: (
        channelId: string,
        userId: string,
        index: number,
        size: number,
      ) =>
        Effect.gen(function* () {
          const channel = yield* db.run((db) =>
            db.query.channel.findFirst({
              columns: {
                id: true,
                userId: true,
              },
              where: and(
                eq(channelTable.id, channelId),
                eq(channelTable.userId, userId),
              ),
            }),
          );
          if (!channel) {
            return yield* Effect.fail(
              new DBNotFoundError({ message: "Channel not found" }),
            );
          }

          const count = yield* db.run((db) =>
            db.$count(videoTable, eq(videoTable.channelId, channel.id)),
          );
          const totalPages = Math.ceil(count / size) - 1;

          // default to first page ...
          if (index > totalPages) {
            const res = yield* db.run((db) =>
              db
                .select()
                .from(videoTable)
                .where(eq(videoTable.channelId, channel.id))
                .limit(size)
                .offset(0),
            );
            return {
              pageIndex: 0,
              pageSize: size,
              totalResults: count,
              items: res,
              maxPageIndex: totalPages,
            };
          }
          const res = yield* db.run((db) =>
            db
              .select()
              .from(videoTable)
              .where(eq(videoTable.channelId, channel.id))
              .limit(size)
              .offset(index * size)
              .$withCache(),
          );

          return {
            pageIndex: index,
            pageSize: size,
            totalResults: count,
            items: res,
            maxPageIndex: totalPages,
          };
        }),
      update: (id: string, data: Partial<Video>) =>
        Effect.gen(function* () {
          const [res] = yield* db.run((db) =>
            db
              .update(videoTable)
              .set(data)
              .where(eq(videoTable.id, id))
              .returning(),
          );
          if (!res) {
            return yield* Effect.fail(
              new DBNotFoundError({ message: "Error" }),
            );
          }

          return res;
        }),
      delete: (id: string) =>
        Effect.gen(function* () {
          yield* db.run((db) =>
            db.delete(videoTable).where(eq(videoTable.id, id)),
          );
        }),
      getById: (id) => getById(id, db),
      create: (data) =>
        Effect.gen(function* () {
          const extension = data.filename.split(".").pop();
          if (!extension) {
            return yield* Effect.fail(
              new InvalidMediaFileNameError({
                message: "Error invalid file name : " + data.filename,
              }),
            );
          }
          const tx = yield* db.run((db) =>
            db.transaction(async (tx) => {
              const [video] = await tx
                .insert(videoTable)
                .values({
                  channelId: data.channelId,
                  title: data.title,
                })
                .returning();

              if (!video) {
                throw new Error("Video not created");
              }
              const [asset] = await tx
                .insert(assetTable)
                .values({
                  videoId: video.id,
                  filename: data.filename,
                  mimeType: data.mimeType,
                  sizeBytes: data.sizeBytes,
                  type: data.type,
                  key: `${video.id}-original.${extension}`,
                })
                .returning();

              if (!asset) {
                throw new Error("Asset not created");
              }
              return {
                video,
                asset,
              };
            }),
          );
          return tx;
        }),
    };
  }),
);

const getById = (id: string, db: DBClient["Type"]) =>
  Effect.gen(function* () {
    const [res] = yield* db.run((db) =>
      db
        .select({
          id: videoTable.id,
          channelId: videoTable.channelId,
          title: videoTable.title,
          description: videoTable.description,
          hlsUrl: videoTable.hlsUrl,
          dashUrl: videoTable.dashUrl,
          thumbnailUrl: videoTable.thumbnailUrl,
          storyboardUrl: videoTable.storyboardUrl,
          duration: videoTable.duration,
          visibility: videoTable.visibility,
          channelName: channelTable.name,
          channelAlias: channelTable.alias,
          channelAvatarUrl: channelTable.avatarUrl,
        })
        .from(videoTable)
        .where(
          and(
            eq(videoTable.id, id),
            isNotNull(videoTable.hlsUrl),
            isNotNull(videoTable.dashUrl),
            isNotNull(videoTable.duration),
            isNotNull(videoTable.storyboardUrl),
            or(
              eq(videoTable.visibility, VideoVisibility.PUBLIC),
              eq(videoTable.visibility, VideoVisibility.PRIVATE),
            ),
          ),
        )
        .innerJoin(channelTable, eq(videoTable.channelId, channelTable.id))
        .$withCache(),
    );
    if (!res) {
      return yield* new DBNotFoundError({ message: "Video not found" });
    }
    return {
      id: res.id,
      channelId: res.channelId,
      title: res.title,
      description: res.description,
      hlsUrl: res.hlsUrl!,
      dashUrl: res.dashUrl!,
      thumbnailUrl: res.thumbnailUrl,
      storyboardUrl: res.storyboardUrl!,
      duration: res.duration!,
      channel: {
        id: res.channelId,
        name: res.channelName,
        alias: res.channelAlias,
        avatarUrl: res.channelAvatarUrl,
      },
    };
  });
