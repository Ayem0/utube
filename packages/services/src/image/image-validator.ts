import type { AssetType } from "@repo/types/enums/asset/asset-type";
import { Context, Effect, Layer } from "effect";
import sharp from "sharp";
import {
  InvalidMediaDimensionError,
  InvalidMediaSizeError,
  InvalidMediaTypeError,
} from "../media/media-errors";
import { MediaValidatorConfig } from "../media/media-validator-config";

export interface ImageValidatorService {
  validate: (
    path: string,
    type: AssetType,
  ) => Effect.Effect<
    void,
    InvalidMediaTypeError | InvalidMediaSizeError | InvalidMediaDimensionError
  >;
}

export class ImageValidator extends Context.Service<
  ImageValidator,
  ImageValidatorService
>()("ImageValidator", {
  make: Effect.gen(function* () {
    const mediaConfig = yield* MediaValidatorConfig;
    return {
      validate: (path) =>
        Effect.gen(function* () {
          const metadata = yield* Effect.tryPromise({
            try: async () => {
              return await sharp(path).metadata();
            },
            catch: (e) => {
              console.log("Error reading image metadata", e);
              return new InvalidMediaTypeError({
                message: "Invalid media file",
              });
            },
          });

          if (
            !metadata.width ||
            !metadata.height ||
            metadata.width <= 0 ||
            metadata.height <= 0 ||
            metadata.width * metadata.height > mediaConfig.maxImageResolution
          ) {
            return yield* new InvalidMediaDimensionError({
              message: "Invalid media dimensions",
            });
          }

          console.log("Image metadata size bytes", metadata.size);
          if (metadata.size && metadata.size > mediaConfig.maxImageBytes) {
            return yield* new InvalidMediaSizeError({
              message: "Invalid media size",
            });
          }

          if (!metadata.format) {
            return yield* new InvalidMediaTypeError({
              message: "Invalid media format",
            });
          }

          if (!mediaConfig.allowedImageFormats.includes(metadata.format)) {
            return yield* new InvalidMediaTypeError({
              message: "Unsupported image format",
            });
          }

          yield* Effect.tryPromise({
            try: async () => {
              await sharp(path).resize(1, 1).toBuffer();
            },
            catch: (e) => {
              console.log("Error processing image", e);
              return new InvalidMediaTypeError({
                message: "Invalid media file",
              });
            },
          });
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(MediaValidatorConfig.Layer),
  );
}
