import type { ImageAssetType } from "@repo/types/enums/image/image-type";
import { Context, Effect, Layer } from "effect";
import sharp, { type SharpInput } from "sharp";
import { ImageProcessingError } from "./image-errors";
import { ImageProcessorConfig } from "./image-processor-config";

export interface ImageProcessorService {
  process: (params: {
    buffer: SharpInput | Array<SharpInput>;
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
  make: Effect.gen(function* () {
    const config = yield* ImageProcessorConfig;

    return {
      process: Effect.fnUntraced(function* ({ buffer, type }) {
        const cfg = config.IMAGE_PROCESSING_CONFIG_MAP[type];
        const base = sharp(buffer);
        const out = yield* Effect.forEach(
          Object.entries(cfg),
          ([variant, options]) =>
            Effect.tryPromise({
              try: async () => {
                const buffer = await base
                  .clone()
                  .resize({ width: options.width, height: options.height })
                  .webp({ preset: options.preset, quality: options.quality })
                  .toBuffer();
                return { buffer, key: `${variant}.webp` };
              },
              catch: (e) => {
                console.log("Error processing image", e);
                return new ImageProcessingError({
                  cause: e,
                  message: "Error processing image",
                });
              },
            }),
          { concurrency: 4 },
        );
        return out;
      }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ImageProcessorConfig.Layer),
  );
}
