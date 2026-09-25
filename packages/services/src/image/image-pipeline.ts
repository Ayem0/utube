import { assetStatus } from "@repo/types/enums/asset/asset-status";
import { imageAssetType } from "@repo/types/enums/image/image-type";
import type { ImageProcessingJob } from "@repo/types/schemas/image-processing-job";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect } from "effect";
import { AssetRepository } from "../asset/asset-repository";
import type { DBNotFoundError } from "../db/db-errors";
import { FileSystem } from "../file-system/file-system";
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
  process: (
    data: ImageProcessingJob,
  ) => Effect.Effect<
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
    const fs = yield* FileSystem;
    return {
      process: (data) =>
        Effect.gen(function* () {
          const asset = yield* assetRepo.getById({ assetId: data.assetId });

          // Already processing
          if (
            asset.status !== assetStatus.UPLOADED &&
            asset.status !== assetStatus.FAILED
          )
            return;

          if (
            !(
              asset.type === imageAssetType.CHANNEL_AVATAR ||
              asset.type === imageAssetType.VIDEO_THUMBNAIL
            )
          ) {
            return yield* new InvalidAssetTypeError({
              message: `Invalid asset type`,
            });
          }
          const file = yield* s3.getFile(asset.originalStorageKey, "assets");
          const outputdir = yield* fs.createDirectory(`/tmp/${asset.id}`);
          const originalPath = `${outputdir}/original`;
          yield* fs.writeFile(originalPath, file);
          yield* imageValidator.validate(originalPath, asset.type);
          const genFilePaths = yield* imageProcessor.process(
            originalPath,
            outputdir,
            asset.type,
          );
          // yield* s3.uploadFiles(
          //   genFilePaths.map((g) => ({ file: Bun.file(g).bytes(), key: `` })),
          //   "test",
          // );
        }),
    };
  }),
}) {}
