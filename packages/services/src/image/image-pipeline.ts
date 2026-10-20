import { assetStatus } from "@repo/types/enums/asset/asset-status";
import { assetType } from "@repo/types/enums/asset/asset-type";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer, Stream } from "effect";
import { exponential } from "effect/Schedule";
import { AssetRepository } from "../asset/asset-repository";
import type { DBNotFoundError } from "../db/db-errors";
import type { FSError } from "../file-system/file-system-errors";
import type {
  InvalidMediaDimensionError,
  InvalidMediaSizeError,
  InvalidMediaTypeError,
} from "../media/media-errors";
import { S3 } from "../s3/s3";
import type { S3Error } from "../s3/s3-errors";
import { ImageProcessingError, InvalidAssetTypeError } from "./image-errors";
import { ImageProcessor } from "./image-processor";
import { ImageValidator } from "./image-validator";

export interface ImagePipelineService {
  process: (params: {
    assetId: string;
  }) => Effect.Effect<
    void,
    | EffectDrizzleQueryError
    | DBNotFoundError
    | S3Error
    | ImageProcessingError
    | InvalidAssetTypeError
    | FSError
    | InvalidMediaTypeError
    | InvalidMediaSizeError
    | InvalidMediaDimensionError
  >;
}

export class ImagePipeline extends Context.Service<
  ImagePipeline,
  ImagePipelineService
>()("ImagePipeline", {
  make: Effect.gen(function* () {
    const assetRepo = yield* AssetRepository;
    const s3 = yield* S3;
    const imageProcessor = yield* ImageProcessor;
    const imageValidator = yield* ImageValidator;
    return {
      process: Effect.fnUntraced(function* ({ assetId }) {
        const asset = yield* assetRepo.claimForProcessing({
          assetId,
        });

        if (
          asset.type !== assetType.VIDEO_THUMBNAIL &&
          asset.type !== assetType.CHANNEL_AVATAR
        ) {
          yield* assetRepo.unclaimFromProcessing({
            assetId,
            status: assetStatus.FAILED,
          });
          return; // TODO change to Effect.fail
        }
        const fileStream = s3.getFile({
          key: asset.originalStorageKey,
          bucket: "uploads",
        });

        const buffer = yield* fileStream.pipe(Stream.runCollect);
        yield* imageValidator.validate({ buffer, type: asset.type });

        const outputs = yield* imageProcessor.process({
          buffer,
          type: asset.type,
        });

        yield* Effect.forEach(outputs, (output) =>
          s3
            .uploadFile(output.key, output.buffer, "images")
            .pipe(
              Effect.retry({ times: 3, schedule: exponential("100 millis") }),
            ),
        );
      }),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make);
}
