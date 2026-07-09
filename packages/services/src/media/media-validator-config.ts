import { Context, Layer } from "effect";

export interface MediaValidatorConfigService {
  readonly maxImageBytes: number;
  readonly maxVideoBytes: number;
  readonly maxImageResolution: number;
  readonly maxVideoResolution: number;
  readonly maxVideoFps: number;
  readonly maxVideoSeconds: number;
  readonly allowedImageFormats: string[];
  readonly allowedVideoFormats: string[];
  readonly allowedVideoCodecs: string[];
  readonly allowedAudioCodecs: string[];
  readonly minimumSampleRate: number;
  readonly maximumSampleRate: number;
  readonly minimumChannels: number;
  readonly maximumChannels: number;
  readonly minVideoHeight: number;
  readonly minVideoWidth: number;
}

export class MediaValidatorConfig extends Context.Service<
  MediaValidatorConfig,
  MediaValidatorConfigService
>()("MediaValidatorConfig") {
  static Layer = Layer.succeed(this, {
    maxImageBytes: 5_000_000, // 5MB
    maxVideoBytes: 10_000_000_000, // 10GB
    maxImageResolution: 1920 * 1080,
    maxVideoResolution: 3840 * 2160, // 4K
    minVideoHeight: 144,
    minVideoWidth: 144,
    maxVideoFps: 60,
    maxVideoSeconds: 12 * 60 * 60,
    allowedImageFormats: ["png", "jpeg", "webp"],
    allowedVideoFormats: [
      "mov",
      "mp4",
      "m4a",
      "3gp",
      "3g2",
      "mj2",
      "matroska",
      "webm",
      "avi",
    ],
    allowedVideoCodecs: [
      "h264",
      "hevc",
      "vp9",
      "av1",
      "mpeg4",
      "mpeg2video",
      "h263",
      "vp8",
      "prores",
      "dnxhd",
      "mjpeg",
    ],
    allowedAudioCodecs: [
      "aac",
      "opus",
      "mp3",
      "vorbis",
      "flac",
      "alac",
      "ac3",
      "eac3",
      "dts",
      "pcm_s16le",
      "pcm_s24le",
      "pcm_f32le",
    ],
    minimumSampleRate: 8000,
    maximumSampleRate: 48000,
    minimumChannels: 1,
    maximumChannels: 8,
  });
}
