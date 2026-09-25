import type { AssetInsert } from "@repo/db/types";
import { type AssetStatus } from "@repo/types/enums/asset/asset-status";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import type { DBNotFoundError } from "../db/db-errors";
import { InvalidMediaTypeError } from "../media/media-errors";
import { S3Error } from "../s3/s3-errors";
import { newId } from "../utils/id";
import { AssetProcessingDispatcher } from "./asset-processing-dispatcher";
import { AssetRepository } from "./asset-repository";
import { AssetUploadFactory } from "./asset-upload-factory";

export interface AssetServiceApi {
  create: (
    input: Omit<AssetInsert, "id" | "storageKey">,
  ) => Effect.Effect<
    { assetId: string; presignedUrl: string },
    EffectDrizzleQueryError | InvalidMediaTypeError | DBNotFoundError | S3Error
  >;
  updateStatus: (
    assetId: string,
    status: AssetStatus,
  ) => Effect.Effect<void, unknown>;
}

export class AssetService extends Context.Service<
  AssetService,
  AssetServiceApi
>()("AssetService", {
  make: Effect.gen(function* () {
    const assetRepo = yield* AssetRepository;
    const assetUploadFactory = yield* AssetUploadFactory;
    const assetProcessingDispatcher = yield* AssetProcessingDispatcher;
    return {
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
