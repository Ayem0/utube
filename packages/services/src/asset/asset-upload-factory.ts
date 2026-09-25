import type { AssetType } from "@repo/types/enums/asset/asset-type";
import { Context, Effect, Layer } from "effect";
import {
  InvalidMediaTypeError,
  type InvalidMediaSizeError,
} from "../media/media-errors";
import { S3 } from "../s3/s3";
import type { S3Error } from "../s3/s3-errors";
import { createAssetStorageKey, type AssetStorageKey } from "./asset-utils";

export interface AssetUploadFactoryApi {
  validate: (params: {
    mimeType: string;
    sizeBytes: number;
    assetType: AssetType;
  }) => Effect.Effect<void, InvalidMediaTypeError | InvalidMediaSizeError>;

  createAssetStorageKey: (params: {
    id: string;
    assetType: AssetType;
    mimeType: string;
  }) => Effect.Effect<AssetStorageKey, InvalidMediaTypeError>;

  getPresignedUrl: (params: {
    assetStorageKey: AssetStorageKey;
    mimeType: string;
  }) => Effect.Effect<string, S3Error>;
}

export class AssetUploadFactory extends Context.Service<
  AssetUploadFactory,
  AssetUploadFactoryApi
>()("AssetUploadFactory", {
  make: Effect.gen(function* () {
    const s3 = yield* S3;
    return {
      createAssetStorageKey: ({ id, assetType, mimeType }) =>
        Effect.try({
          try: () => createAssetStorageKey({ assetType, mimeType, id }),
          catch: (err) => {
            console.log("Error creating asset storage key", err);
            return new InvalidMediaTypeError({
              message: "Invalid media type",
            });
          },
        }),
      getPresignedUrl: ({ assetStorageKey, mimeType }) =>
        s3.getPresignedUrl({
          bucket: "assets",
          mimeType,
          path: assetStorageKey,
          method: "PUT",
          expiresIn: 3600,
        }),
      validate: ({ mimeType, sizeBytes, assetType: type }) =>
        Effect.gen(function* () {
          // TODO make size and mimeType validation by assetType
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make);
}
