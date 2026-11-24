import { video, videoAttempt } from "@repo/db/schema";
import type { VideoAttempt } from "@repo/db/types";
import { and, eq, exists, type DrizzleQueryError } from "drizzle-orm";
import { Context, Effect } from "effect";
import { DB } from "../db/db";
import type { DBNotFoundError } from "../db/db-errors";

export interface VideoAttemptRepositoryApi {
  getByAssetId: (params: {
    assetId: string;
  }) => Effect.Effect<VideoAttempt, DBNotFoundError | DrizzleQueryError>;
}

export class VideoAttemptRepository extends Context.Service<
  VideoAttemptRepository,
  VideoAttemptRepositoryApi
>()("VideoAttemptRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;
    return {
      getByAssetId: Effect.fn(function* ({ assetId }) {
        return db.run((cl) =>
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
                    .where(and(eq(video.latestAttemptId, videoAttempt.id))),
                ),
              ),
            ),
        );
      }),
    };
  }),
}) {}
