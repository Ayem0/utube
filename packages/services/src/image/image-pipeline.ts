import { assetStatus } from "@repo/types/enums/asset/asset-status";
import { assetType } from "@repo/types/enums/asset/asset-type";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer, Stream } from "effect";
import { exponential } from "effect/Schedule";
import { AssetRepository } from "../asset/asset-repository";
import type { DBNotFoundError } from "../db/db-errors";
import { S3 } from "../s3/s3";
import type { S3Error } from "../s3/s3-errors";
import { ImageProcessingError, InvalidAssetTypeError } from "./image-errors";
import { ImageProcessor } from "./image-processor";
import { ImageValidator, type ImageValidationError } from "./image-validator";

export interface ImagePipelineService {
  process: (params: {
    assetId: string;
  }) => Effect.Effect<
    void,
    | EffectDrizzleQueryError
    | DBNotFoundError
    | S3Error
    | InvalidAssetTypeError
    | ImageProcessingError
    | ImageValidationError
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
          // TODO see what to do
          return;
        }

        const relation = yield* assetRepo.getRelation({
          assetId: asset.id,
          assetType: asset.type,
        });

        yield* Effect.log("Getting file");
        const fileStream = s3.getFile({
          key: asset.originalStorageKey,
          bucket: "uploads",
        });
        yield* Effect.log("Got file");

        yield* Effect.log("Collecting");

        const collected = yield* Stream.runCollect(fileStream);
        yield* Effect.log("Collected");

        const input = Buffer.concat(collected);

        yield* Effect.log("Validating");
        yield* imageValidator.validate({ input: input, type: asset.type });
        yield* Effect.log("Validated");

        const outputs = yield* imageProcessor.process({
          input: input,
          type: asset.type,
        });

        yield* Effect.log("Processed");

        yield* Effect.forEach(outputs, (output) =>
          s3
            .uploadFile({
              key: `${assetId}/${output.key}`,
              file: output.buffer,
              bucket: "images",
              size: BigInt(output.buffer.byteLength),
            })
            .pipe(
              Effect.retry({ times: 3, schedule: exponential("100 millis") }),
            ),
        );

        // TODO update asset status and update the relation
      }),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(AssetRepository.Layer),
    // Layer.provide(ImageProcessor.Layer),
    // Layer.provide(ImageValidator.Layer),
  );
}
