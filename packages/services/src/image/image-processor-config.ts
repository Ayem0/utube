import {
  imageAssetType,
  type ImageAssetType,
} from "@repo/types/enums/image/image-type";
import { Context, Layer } from "effect";
import type { PresetEnum } from "sharp";

type ImageProcessingConfig = Array<{
  width: number;
  height: number;
  preset: keyof PresetEnum;
  quality: number;
}>;
export interface ImageProcessorConfigService {
  readonly IMAGE_PROCESSING_CONFIG_MAP: Record<
    ImageAssetType,
    ImageProcessingConfig
  >;
}

export class ImageProcessorConfig extends Context.Service<
  ImageProcessorConfig,
  ImageProcessorConfigService
>()("ImageProcessorConfig") {
  static Layer = Layer.succeed(this, {
    IMAGE_PROCESSING_CONFIG_MAP: {
      [imageAssetType.CHANNEL_AVATAR]: [
        { width: 160, height: 160, preset: "icon", quality: 80 },
        { width: 64, height: 64, preset: "icon", quality: 50 },
      ],
      [imageAssetType.VIDEO_THUMBNAIL]: [
        { width: 1280, height: 720, preset: "default", quality: 80 },
        { width: 640, height: 360, preset: "default", quality: 50 },
      ],
    },
  });
}
