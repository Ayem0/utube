import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { video as videoTable } from "../../db/schema";
import { UndefinedError } from "../../lib/utils/undefined-error";
import { VideoCreationStatus } from "../../lib/video/video-status";
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
    status: VideoCreationStatus;
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
}

const makeLive = () =>
  Effect.gen(function* () {
    const db = yield* DBClient;
    return {
      update: (data: { id: string; status: VideoCreationStatus }) =>
        Effect.gen(function* () {
          const [res] = yield* db.run((db) =>
            db
              .update(videoTable)
              .set({
                creationStatus: data.status,
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
  });

export const VideoReposistoryLive = Layer.effect(VideoRepository, makeLive());
