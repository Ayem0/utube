import { asset, channel, video } from "@repo/db/schema";
import type { Asset, AssetInsert, Channel, Video } from "@repo/db/types";
import {
  assetStatus,
  type AssetStatus,
} from "@repo/types/enums/asset/asset-status";
import { assetType, type AssetType } from "@repo/types/enums/asset/asset-type";
import { and, eq, or } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer, UndefinedOr } from "effect";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";

export interface AssetRepositoryApi {
  getById: (params: {
    assetId: string;
  }) => Effect.Effect<Asset, EffectDrizzleQueryError | DBNotFoundError>;

  create: (
    params: AssetInsert,
  ) => Effect.Effect<Asset, EffectDrizzleQueryError | DBNotFoundError>;

  updateAssetStatus: (params: {
    assetId: string;
    status: AssetStatus;
  }) => Effect.Effect<Asset, EffectDrizzleQueryError | DBNotFoundError>;

  claimForProcessing: (params: {
    assetId: string;
  }) => Effect.Effect<Asset, EffectDrizzleQueryError | DBNotFoundError>;

  unclaimFromProcessing: (params: {
    assetId: string;
    status: AssetStatus;
  }) => Effect.Effect<Asset, EffectDrizzleQueryError | DBNotFoundError>;

  getRelation: <T extends AssetType>(params: {
    assetId: string;
    assetType: T;
  }) => Effect.Effect<
    AssetRelation<T>,
    EffectDrizzleQueryError | DBNotFoundError
  >;
}

type AssetRelation<T extends AssetType> = T extends
  typeof assetType.VIDEO | typeof assetType.VIDEO_THUMBNAIL
  ? Video
  : T extends typeof assetType.CHANNEL_AVATAR
    ? Channel
    : never;

export class AssetRepository extends Context.Service<
  AssetRepository,
  AssetRepositoryApi
>()("AssetRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;
    return {
      getRelation: Effect.fnUntraced(function* ({ assetId, assetType: type }) {
        switch (type) {
          case assetType.VIDEO: {
            const res = yield* db.run((cl) =>
              cl
                .select()
                .from(video)
                .where(eq(video.sourceVideoAssetId, assetId))
                .limit(1)
                .pipe(
                  Effect.flatMap(([row]) =>
                    UndefinedOr.match(row, {
                      onDefined: (row) => Effect.succeed(row),
                      onUndefined: () =>
                        new DBNotFoundError({ message: "Video not found" }),
                    }),
                  ),
                ),
            );
            return res;
          }
          case assetType.VIDEO_THUMBNAIL: {
            const row = yield* db.run((cl) =>
              cl
                .select()
                .from(video)
                .where(eq(video.pendingThumbnailAssetId, assetId))
                .limit(1)
                .pipe(
                  Effect.flatMap(([row]) =>
                    UndefinedOr.match(row, {
                      onDefined: (row) => Effect.succeed(row),
                      onUndefined: () =>
                        new DBNotFoundError({ message: "Video not found" }),
                    }),
                  ),
                ),
            );
            return row;
          }
          case assetType.CHANNEL_AVATAR: {
            const row = yield* db.run((db) =>
              db
                .select()
                .from(channel)
                .where(eq(channel.pendingAvatarAssetId, assetId))
                .limit(1)
                .pipe(
                  Effect.flatMap(([row]) =>
                    UndefinedOr.match(row, {
                      onDefined: (row) => Effect.succeed(row),
                      onUndefined: () =>
                        new DBNotFoundError({ message: "Channel not found" }),
                    }),
                  ),
                ),
            );
            return row;
          }
          case assetType.SUBTITLE:
          case assetType.AUDIO:
            return yield* new DBNotFoundError({
              message: "Asset type not implemented",
            });
        }
      }) as AssetRepositoryApi["getRelation"],
      unclaimFromProcessing: ({ assetId, status }) =>
        db.run((cl) =>
          cl
            .update(asset)
            .set({
              status,
            })
            .where(eq(asset.id, assetId))
            .returning()
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Asset not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),
      getById: ({ assetId }) =>
        db.run((cl) =>
          cl
            .select()
            .from(asset)
            .where(eq(asset.id, assetId))
            .limit(1)
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Asset not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),
      create: (values) =>
        db.run((cl) =>
          cl
            .insert(asset)
            .values(values)
            .returning()
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Asset not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),
      updateAssetStatus: ({ assetId, status }) =>
        db.run((cl) =>
          cl
            .update(asset)
            .set({
              status: status,
            })
            .where(eq(asset.id, assetId))
            .returning()
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Asset not found" }),
                  onDefined: (res) => Effect.succeed(res),
                }),
              ),
            ),
        ),

      claimForProcessing: ({ assetId }) =>
        db.run((cl) =>
          cl
            .update(asset)
            .set({
              status: assetStatus.PROCESSING,
            })
            .where(
              and(
                eq(asset.id, assetId),
                or(
                  eq(asset.status, assetStatus.PENDING),
                  eq(asset.status, assetStatus.FAILED),
                ),
              ),
            )
            .returning()
            .pipe(
              Effect.flatMap(([res]) =>
                UndefinedOr.match(res, {
                  onUndefined: () =>
                    new DBNotFoundError({ message: "Asset not found" }),
                  onDefined: (res) => Effect.succeed(res),
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
