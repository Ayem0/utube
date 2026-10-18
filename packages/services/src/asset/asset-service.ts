import type { AssetInsert } from "@repo/db/types";
import { type AssetStatus } from "@repo/types/enums/asset/asset-status";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import type { SqlError } from "effect/sql/SqlError";
import { DB } from "../db/db";
import type { DBNotFoundError } from "../db/db-errors";
import {
  InvalidMediaTypeError,
  type InvalidMediaSizeError,
} from "../media/media-errors";
import { S3Error } from "../s3/s3-errors";
import { newId } from "../utils/id";
import { AssetProcessingDispatcher } from "./asset-processing-dispatcher";
import { AssetRepository } from "./asset-repository";
import { AssetUploadFactory } from "./asset-upload-factory";

export interface AssetServiceApi {
  create: (
    input: Omit<AssetInsert, "id" | "originalStorageKey">,
  ) => Effect.Effect<
    { assetId: string; presignedUrl: string },
    EffectDrizzleQueryError | InvalidMediaTypeError | DBNotFoundError | S3Error
  >;
  updateStatus: (
    assetId: string,
    status: AssetStatus,
  ) => Effect.Effect<void, unknown>;

  createWithRelation: <A, E, R>({
    input,
    effect,
  }: {
    input: Omit<AssetInsert, "id" | "originalStorageKey">;
    effect: (assetId: string) => Effect.Effect<A, E, R>;
  }) => Effect.Effect<
    { assetId: string; presignedUrl: string; result: A },
    | EffectDrizzleQueryError
    | InvalidMediaTypeError
    | InvalidMediaSizeError
    | DBNotFoundError
    | S3Error
    | SqlError
    | E,
    R
  >;
}

export class AssetService extends Context.Service<
  AssetService,
  AssetServiceApi
>()("AssetService", {
  make: Effect.gen(function* () {
    const assetRepo = yield* AssetRepository;
    const assetUploadFactory = yield* AssetUploadFactory;
    const assetProcessingDispatcher = yield* AssetProcessingDispatcher;
    const db = yield* DB;
    return {
      createWithRelation: Effect.fnUntraced(function* ({ input, effect }) {
        const id = newId();
        yield* assetUploadFactory.validate({
          assetType: input.type,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        });
        const storageKey = yield* assetUploadFactory.createAssetStorageKey({
          id,
          mimeType: input.mimeType,
          assetType: input.type,
        });

        const presignedUrl = yield* assetUploadFactory.getPresignedUrl({
          assetStorageKey: storageKey,
          mimeType: input.mimeType,
        });

        const res = yield* Effect.gen(function* () {
          yield* assetRepo.create({
            id,
            ownerUserId: input.ownerUserId,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            type: input.type,
            originalStorageKey: storageKey,
          });
          const creatorRes = yield* effect(id);
          return creatorRes;
        }).pipe(db.withTransaction);

        return { assetId: id, presignedUrl, result: res };
      }),
      create: ({ ownerUserId, mimeType, sizeBytes, type }) =>
        Effect.gen(function* () {
          const id = newId();
          const storageKey = yield* assetUploadFactory.createAssetStorageKey({
            id,
            mimeType,
            assetType: type,
          });

          yield* assetRepo.create({
            id,
            ownerUserId,
            mimeType,
            sizeBytes,
            type,
            originalStorageKey: storageKey,
          });
          const presignedUrl = yield* assetUploadFactory.getPresignedUrl({
            assetStorageKey: storageKey,
            mimeType,
          });
          return { assetId: id, presignedUrl };
        }),

      updateStatus: (assetId, status) =>
        Effect.gen(function* () {
          const asset = yield* assetRepo.updateAssetStatus({ assetId, status });
          yield* assetProcessingDispatcher.dispatch(asset);
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(AssetProcessingDispatcher.Layer),
    Layer.provide(AssetRepository.Layer),
    Layer.provide(AssetUploadFactory.Layer),
  );
}
