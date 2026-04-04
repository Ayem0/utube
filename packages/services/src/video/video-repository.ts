import { channel as channelTable, video as videoTable } from "@repo/db/schema";
import type { Video } from "@repo/db/types";
import { PaginationResult } from "@repo/types/types/pagination";
import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DBClient } from "../db/db-client";
import { DBError, DBNotFoundError } from "../db/db-errors";

export class VideoRepository extends Context.Tag("VideoRepository")<
  VideoRepository,
  VideoRepositoryService
>() {}

export interface VideoRepositoryService {
  update: (
    id: string,
    data: Partial<Video>,
  ) => Effect.Effect<Video, DBNotFoundError | DBError>;
  create: (data: {
    channelId: string;
    title: string;
    description: string;
    tempVideoKey: string;
    tempThumbnailKey: string;
  }) => Effect.Effect<Video, DBNotFoundError | DBError>;
  delete: (id: string) => Effect.Effect<void, DBError>;
  getStudioVideosByChannelId: (
    channelId: string,
    userId: string,
    index: number,
    size: number,
  ) => Effect.Effect<PaginationResult<Video[]>, DBError | DBNotFoundError>;
}

export const VideoReposistoryLive = Layer.effect(
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
              .offset(index * size),
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
      create: (data: {
        channelId: string;
        title: string;
        description: string;
        tempVideoKey: string;
        tempThumbnailKey: string;
      }) =>
        Effect.gen(function* () {
          const id = crypto.randomUUID();
          const [res] = yield* db.run((db) =>
            db
              .insert(videoTable)
              .values({
                id,
                channelId: data.channelId,
                title: data.title,
                description: data.description,
                tempVideoKey: data.tempVideoKey,
                tempThumbnailKey: data.tempThumbnailKey,
              })
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
    };
  }),
);
