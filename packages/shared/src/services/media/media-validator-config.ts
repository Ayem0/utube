import { Context, Layer } from "effect";

export class MediaValidatorConfig extends Context.Tag("MediaValidatorConfig")<
  MediaValidatorConfig,
  MediaValidatorConfigService
>() {}

export interface MediaValidatorConfigService {
  readonly maxImageBytes: number;
  readonly maxVideoBytes: number;
  readonly maxImageResolution: number;
  readonly maxVideoResolution: number;
  readonly maxVideoFps: number;
  readonly maxVideoSeconds: number;
  readonly allowedImageTypes: string[];
  readonly allowedVideoTypes: string[];
}

export const MediaValidatorConfigLive = Layer.succeed(MediaValidatorConfig, {
  maxImageBytes: 5_000_000, // 5MB
  maxVideoBytes: 10_000_000_000, // 10GB
  maxImageResolution: 3840 * 2160, // TODO voir quoi mettre pr les images
  maxVideoResolution: 3840 * 2160, // 4K
  maxVideoFps: 60,
  maxVideoSeconds: 12 * 60 * 60,
  allowedImageTypes: ["image/png", "image/jpeg", "image/webp"],
  allowedVideoTypes: ["video/mp4"],
});
