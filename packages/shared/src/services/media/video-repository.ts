import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { channel as channelTable, video as videoTable } from "../../db/schema";
import { PaginationResult } from "../../lib/types/pagination-result";
import { UndefinedError } from "../../lib/utils/undefined-error";
import { DBClient } from "../db/db-client";
import { DBError } from "../db/db-errors";

export class VideoRepository extends Context.Tag("VideoRepository")<
  VideoRepository,
  VideoRepositoryService
>() {}

type Video = typeof videoTable.$inferSelect;

export interface VideoRepositoryService {
  update: (data: {
    id: string;
    data: Partial<Video>;
  }) => Effect.Effect<Video, UndefinedError | DBError>;
  create: (data: {
    id: string;
    channelId: string;
    title: string;
    description: string;
    tempVideoKey: string;
    tempThumbnailKey: string;
  }) => Effect.Effect<Video, UndefinedError | DBError>;
  delete: (id: string) => Effect.Effect<void, DBError>;
  getStudioVideosByChannelId: (
    channelId: string,
    userId: string,
    index: number,
    size: number,
  ) => Effect.Effect<PaginationResult<Video>, DBError | UndefinedError>;
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
              new UndefinedError({ message: "Channel not found" }),
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
              maxPages: totalPages,
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
            maxPages: totalPages,
          };
        }),
      update: (data: { id: string; data: Partial<Video> }) =>
        Effect.gen(function* () {
          const [res] = yield* db.run((db) =>
            db
              .update(videoTable)
              .set({
                ...data.data,
              })
              .where(eq(videoTable.id, data.id))
              .returning(),
          );
          if (!res) {
            return yield* Effect.fail(new UndefinedError({ message: "Error" }));
          }

          return res;
        }),
      create: (data: {
        id: string;
        channelId: string;
        title: string;
        description: string;
        tempVideoKey: string;
        tempThumbnailKey: string;
      }) =>
        Effect.gen(function* () {
          const [res] = yield* db.run((db) =>
            db
              .insert(videoTable)
              .values({
                id: data.id,
                channelId: data.channelId,
                title: data.title,
                description: data.description,
                tempVideoKey: data.tempVideoKey,
                tempThumbnailKey: data.tempThumbnailKey,
              })
              .returning(),
          );
          if (!res) {
            return yield* Effect.fail(new UndefinedError({ message: "Error" }));
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
