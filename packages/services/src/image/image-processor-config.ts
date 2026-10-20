import {
  imageAssetType,
  type ImageAssetType,
} from "@repo/types/enums/image/image-type";
import type { AssetVariant } from "@repo/types/schemas/asset-variant";
import { Context, Layer } from "effect";
import type { PresetEnum } from "sharp";

export interface ImageProcessorConfigService {
  readonly IMAGE_PROCESSING_CONFIG_MAP: ImageProcessMap;
}

type ImageProcessingOptions = {
  width: number;
  height: number;
  preset: keyof PresetEnum;
  quality: number;
};
type ImageProcessMap = {
  [K in ImageAssetType]: Record<
    keyof Extract<AssetVariant, { type: K }>["variants"],
    ImageProcessingOptions
  >;
};

export class ImageProcessorConfig extends Context.Service<
  ImageProcessorConfig,
  ImageProcessorConfigService
>()("ImageProcessorConfig") {
  static Layer = Layer.succeed(this, {
    IMAGE_PROCESSING_CONFIG_MAP: {
      [imageAssetType.CHANNEL_AVATAR]: {
        "160x160": {
          width: 160,
          height: 160,
          preset: "icon",
          quality: 80,
        },
        "64x64": {
          width: 64,
          height: 64,
          preset: "icon",
          quality: 50,
        },
      },
      [imageAssetType.VIDEO_THUMBNAIL]: {
        "1280x720": {
          width: 1280,
          height: 720,
          preset: "default",
          quality: 80,
        },
        "640x360": { width: 640, height: 360, preset: "default", quality: 50 },
      },
    },
  });
}
