import { asset, video } from "@repo/db/schema";
import type { Asset } from "@repo/db/types";
import type { AssetStatus } from "@repo/types/enums/asset/asset-status";
import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DBClient } from "../db/db-client";
import { DBError, DBNotFoundError } from "../db/db-errors";

export class AssetRepository extends Context.Tag("AssetRepository")<
  AssetRepository,
  AssetRepositoryService
>() {}

export interface AssetRepositoryService {
  create: (
    data: Pick<
      Asset,
      "filename" | "mimeType" | "sizeBytes" | "type" | "videoId"
    >,
  ) => Effect.Effect<Asset, DBError | DBNotFoundError>;
  update: (
    id: string,
    videoId: string,
    channelId: string,
    status: AssetStatus,
  ) => Effect.Effect<Asset, DBError | DBNotFoundError>;
}

export const AssetRepositoryLive = Layer.effect(
  AssetRepository,
  Effect.gen(function* () {
    const db = yield* DBClient;
    return {
      create: (data) =>
        Effect.gen(function* () {
          const [res] = yield* db.run((db) =>
            db
              .insert(asset)
              .values({
                filename: data.filename,
                mimeType: data.mimeType,
                sizeBytes: data.sizeBytes,
                type: data.type,
                videoId: data.videoId,
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
      update: (id, videoId, channelId, status) =>
        Effect.gen(function* () {
          const [res] = yield* db.run((db) =>
            db
              .update(asset)
              .set({ status })
              .from(video)
              .where(
                and(
                  eq(asset.id, id),
                  eq(asset.videoId, videoId),
                  eq(video.id, videoId),
                  eq(video.channelId, channelId),
                ),
              )
              .returning(),
          );

          if (!res) {
            return yield* Effect.fail(
              new DBNotFoundError({ message: "Error" }),
            );
          }

          return res;
        }),
    };
  }),
);
