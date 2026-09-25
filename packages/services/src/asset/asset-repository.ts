import { asset } from "@repo/db/schema";
import type { Asset, AssetInsert } from "@repo/db/types";
import {
  assetStatus,
  type AssetStatus,
} from "@repo/types/enums/asset/asset-status";
import { and, eq } from "drizzle-orm";
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
}

export class AssetRepository extends Context.Service<
  AssetRepository,
  AssetRepositoryApi
>()("AssetRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;
    return {
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
              and(eq(asset.id, assetId), eq(asset.status, assetStatus.PENDING)),
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
