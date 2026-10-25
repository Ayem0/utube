import type { AssetType } from "@repo/types/enums/asset/asset-type";
import { Context, Data, Effect } from "effect";

type Valid<T extends boolean> = T extends true
  ? {
      valid: true;
    }
  : {
      valid: false;
      reason: string;
    };

export interface ImageValidatorService {
  validate: (params: {
    input: string | ArrayBuffer | NodeJS.TypedArray | Blob;
    type: AssetType;
  }) => Effect.Effect<Valid<boolean>, ImageValidationError>;
}

export class ImageValidationError extends Data.TaggedError(
  "ImageValidationError",
)<{ message: string; cause: unknown }> {}

export class ImageValidator extends Context.Service<
  ImageValidator,
  ImageValidatorService
>()("ImageValidator", {
  // make: Effect.gen(function* () {
  //   const mediaConfig = yield* MediaValidatorConfig;
  //   return {
  //     validate: Effect.fnUntraced(function* ({ input, type }) {
  //       const metadata = yield* Effect.tryPromise({
  //         try: async () => {
  //           return await sharp(input).metadata();
  //         },
  //         catch: (e) => {
  //           console.log("Error reading image metadata", e);
  //           return new InvalidMediaTypeError({
  //             message: "Invalid media file",
  //           });
  //         },
  //       });
  //       if (
  //         !metadata.width ||
  //         !metadata.height ||
  //         metadata.width <= 0 ||
  //         metadata.height <= 0 ||
  //         metadata.width * metadata.height > mediaConfig.maxImageResolution
  //       ) {
  //         return yield* new InvalidMediaDimensionError({
  //           message: "Invalid media dimensions",
  //         });
  //       }
  //       console.log("Image metadata size bytes", metadata.size);
  //       if (metadata.size && metadata.size > mediaConfig.maxImageBytes) {
  //         return yield* new InvalidMediaSizeError({
  //           message: "Invalid media size",
  //         });
  //       }
  //       if (!metadata.format) {
  //         return yield* new InvalidMediaTypeError({
  //           message: "Invalid media format",
  //         });
  //       }
  //       if (!mediaConfig.allowedImageFormats.includes(metadata.format)) {
  //         return yield* new InvalidMediaTypeError({
  //           message: "Unsupported image format",
  //         });
  //       }
  //       yield* Effect.tryPromise({
  //         try: async () => {
  //           await sharp(buffer).resize(1, 1).toBuffer();
  //         },
  //         catch: (e) => {
  //           console.log("Error processing image", e);
  //           return new InvalidMediaTypeError({
  //             message: "Invalid media file",
  //           });
  //         },
  //       });
  //     }),
  //   };
  // }),
}) {
  // static Layer = Layer.effect(this, this.make).pipe(
  //   Layer.provide(MediaValidatorConfig.Layer),
  // );
}
