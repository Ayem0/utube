import type { ImageAssetType } from "@repo/types/enums/image/image-type";
import { Context, Effect, Layer } from "effect";
import sharp from "sharp";
import { ImageProcessingError } from "./image-errors";
import { ImageProcessorConfig } from "./image-processor-config";

export interface ImageProcessorService {
  process: (
    originalPath: string,
    outputdir: string,
    type: ImageAssetType,
  ) => Effect.Effect<string[], ImageProcessingError>;
}

export class ImageProcessor extends Context.Service<
  ImageProcessor,
  ImageProcessorService
>()("ImageProcessor", {
  make: Effect.gen(function* () {
    const config = yield* ImageProcessorConfig;

    return {
      process: (originalPath, outputDir, type) =>
        Effect.tryPromise({
          try: async () => {
            const cfg = config.IMAGE_PROCESSING_CONFIG_MAP[type];
            const image = sharp(originalPath);
            const outputPaths = cfg.map(
              (c) => `${outputDir}/${c.width}x${c.height}.webp`,
            );
            const paths = await Promise.all(
              cfg.map(async (c, i) => {
                const outputPath = outputPaths[i]!;

                return await image
                  .clone()
                  .resize({ width: c.width, height: c.height })
                  .webp({ preset: c.preset, quality: c.quality })
                  .toFile(outputPath);
              }),
            );
            console.log("output paths", paths);
            return outputPaths;
          },
          catch: (e) => {
            console.log("Error processing image", e);
            return new ImageProcessingError({
              cause: e,
              message: "Error processing image",
            });
          },
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ImageProcessorConfig.Layer),
  );
}
