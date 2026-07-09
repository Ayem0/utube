import { asset } from "@repo/db/schema";
import type { Asset, AssetInsert } from "@repo/db/types";
import {
  assetStatus,
  type AssetStatus,
} from "@repo/types/enums/asset/asset-status";
import { and, eq } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import { DB, repo, type RepoFn } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";

export interface AssetRepositoryApi {
  getById: RepoFn<
    {
      assetId: string;
    },
    Asset,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  create: RepoFn<AssetInsert, Asset, EffectDrizzleQueryError | DBNotFoundError>;

  updateAssetStatus: RepoFn<
    {
      assetId: string;
      status: AssetStatus;
    },
    Asset,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  claimForProcessing: RepoFn<
    { assetId: string },
    Asset,
    EffectDrizzleQueryError | DBNotFoundError
  >;
}

export class AssetRepository extends Context.Service<
  AssetRepository,
  AssetRepositoryApi
>()("AssetRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;
    return repo<AssetRepositoryApi>(db, {
      getById: ({ assetId }, db) =>
        Effect.gen(function* () {
          const [foundAsset] = yield* db
            .select()
            .from(asset)
            .where(eq(asset.id, assetId))
            .limit(1);

          if (!foundAsset) {
            return yield* new DBNotFoundError({ message: "Asset not found" });
          }

          return foundAsset;
        }),
      create: (values, db) =>
        Effect.gen(function* () {
          const [row] = yield* db.insert(asset).values(values).returning();
          if (!row) {
            return yield* new DBNotFoundError({ message: "Asset not found" });
          }
          return row;
        }),
      updateAssetStatus: ({ assetId, status }, db) =>
        Effect.gen(function* () {
          const [updated] = yield* db
            .update(asset)
            .set({
              status: status,
            })
            .where(eq(asset.id, assetId))
            .returning();
          if (!updated) {
            return yield* new DBNotFoundError({ message: "Asset not found" });
          }
          return updated;
        }),

      claimForProcessing: ({ assetId }, db) =>
        Effect.gen(function* () {
          const [updated] = yield* db
            .update(asset)
            .set({
              status: assetStatus.PROCESSING,
            })
            .where(
              and(
                eq(asset.id, assetId),
                eq(asset.status, assetStatus.UPLOADED),
              ),
            )
            .returning();
          if (!updated) {
            return yield* new DBNotFoundError({ message: "Asset not found" });
          }
          return updated;
        }),
    });
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(Layer.provide(DB.Layer));
}
