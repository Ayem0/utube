import { videoPlayback } from "@repo/db/schema";
import type { VideoPlayback, VideoPlaybackInsert } from "@repo/db/types";
import { eq } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import { DB, repo, type RepoFn } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";

export interface VideoPlaybackRepositoryApi {
  create: RepoFn<
    VideoPlaybackInsert,
    VideoPlayback,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  update: RepoFn<
    {
      id: string;
      values: Partial<
        Pick<
          VideoPlaybackInsert,
          | "status"
          | "hlsMasterKey"
          | "dashManifestKey"
          | "storyboardKey"
          | "renditions"
        >
      >;
    },
    VideoPlayback,
    EffectDrizzleQueryError | DBNotFoundError
  >;
}

export class VideoPlaybackRepository extends Context.Service<
  VideoPlaybackRepository,
  VideoPlaybackRepositoryApi
>()("VideoPlaybackRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    return repo<VideoPlaybackRepositoryApi>(db, {
      create: (values, db) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .insert(videoPlayback)
            .values(values)
            .returning();

          if (!row) {
            return yield* new DBNotFoundError({
              message: "Error creating video playback",
            });
          }

          return row;
        }),

      update: ({ id, values }, db) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .update(videoPlayback)
            .set(values)
            .where(eq(videoPlayback.id, id))
            .returning();

          if (!row) {
            return yield* new DBNotFoundError({
              message: "Error updating video playback",
            });
          }

          return row;
        }),
    });
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(Layer.provide(DB.Layer));
}
