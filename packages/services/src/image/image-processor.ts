import type { ImageAssetType } from "@repo/types/enums/image/image-type";
import { Context, Effect } from "effect";
import { ImageProcessingError } from "./image-errors";

export interface ImageProcessorService {
  process: (params: {
    input: string | ArrayBuffer | NodeJS.TypedArray | Blob;
    type: ImageAssetType;
  }) => Effect.Effect<
    { buffer: Uint8Array; key: string }[],
    ImageProcessingError
  >;
}

export class ImageProcessor extends Context.Service<
  ImageProcessor,
  ImageProcessorService
>()("ImageProcessor", {
  // make: Effect.gen(function* () {
  //   const config = yield* ImageProcessorConfig;
  //   return {
  //     process: Effect.fnUntraced(function* ({ input: buffer, type }) {
  //       const cfg = config.IMAGE_PROCESSING_CONFIG_MAP[type];
  //       const base = sharp(buffer);
  //       const out = yield* Effect.forEach(
  //         Object.entries(cfg),
  //         ([variant, options]) =>
  //           Effect.tryPromise({
  //             try: async () => {
  //               const buffer = await base
  //                 .clone()
  //                 .resize({ width: options.width, height: options.height })
  //                 .webp({ preset: options.preset, quality: options.quality })
  //                 .toBuffer();
  //               return { buffer, key: `${variant}.webp` };
  //             },
  //             catch: (e) => {
  //               console.log("Error processing image", e);
  //               return new ImageProcessingError({
  //                 cause: e,
  //                 message: "Error processing image",
  //               });
  //             },
  //           }),
  //         { concurrency: 4 },
  //       );
  //       return out;
  //     }),
  //   };
  // }),
}) {
  // static Layer = Layer.effect(this, this.make).pipe(
  //   Layer.provide(ImageProcessorConfig.Layer),
  // );
}
