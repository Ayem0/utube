import { videoPlayback } from "@repo/db/schema";
import type { VideoPlayback, VideoPlaybackInsert } from "@repo/db/types";
import { eq } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer, UndefinedOr } from "effect";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";

export interface VideoPlaybackRepositoryApi {
  create: (
    params: VideoPlaybackInsert,
  ) => Effect.Effect<VideoPlayback, EffectDrizzleQueryError | DBNotFoundError>;

  update: (params: {
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
  }) => Effect.Effect<VideoPlayback, EffectDrizzleQueryError | DBNotFoundError>;
}

export class VideoPlaybackRepository extends Context.Service<
  VideoPlaybackRepository,
  VideoPlaybackRepositoryApi
>()("VideoPlaybackRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    return {
      create: (values) =>
        db.run((db) =>
          db
            .insert(videoPlayback)
            .values(values)
            .returning()
            .pipe(
              Effect.flatMap(([row]) =>
                UndefinedOr.match(row, {
                  onDefined: (row) => Effect.succeed(row),
                  onUndefined: () =>
                    new DBNotFoundError({
                      message: "Error creating video playback",
                    }),
                }),
              ),
            ),
        ),

      update: ({ id, values }) =>
        db.run((db) =>
          db
            .update(videoPlayback)
            .set(values)
            .where(eq(videoPlayback.id, id))
            .returning()
            .pipe(
              Effect.flatMap(([row]) =>
                UndefinedOr.match(row, {
                  onDefined: (row) => Effect.succeed(row),
                  onUndefined: () =>
                    new DBNotFoundError({
                      message: "Error updating video playback",
                    }),
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
