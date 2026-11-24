import { Context, Layer } from "effect";

export interface MediaValidatorConfigService {
  readonly maxImageBytes: number;
  readonly maxVideoBytes: number;
  readonly maxImageResolution: number;
  readonly maxVideoFps: number;
  readonly maxVideoSeconds: number;
  readonly allowedImageFormats: string[];
  readonly allowedVideoFormats: string[];
  readonly allowedVideoCodecs: string[];
  readonly allowedAudioCodecs: string[];
  readonly minSampleRate: number;
  readonly maxSampleRate: number;
  readonly minChannels: number;
  readonly maxChannels: number;
  readonly minVideoHeight: number;
  readonly minVideoWidth: number;
  readonly minVideoSeconds: number;
  readonly maxVideoWidth: number;
  readonly maxVideoHeight: number;
}

export class MediaValidatorConfig extends Context.Service<
  MediaValidatorConfig,
  MediaValidatorConfigService
>()("MediaValidatorConfig") {
  static Layer = Layer.succeed(this, {
    maxImageBytes: 5_000_000, // 5MB
    maxVideoBytes: 10_000_000_000, // 10GB
    maxImageResolution: 1920 * 1080,
    minVideoHeight: 144,
    minVideoWidth: 144,
    maxVideoFps: 60,
    maxVideoSeconds: 6 * 60 * 60,
    minVideoSeconds: 1,
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
    minSampleRate: 8000,
    maxSampleRate: 192000,
    minChannels: 1,
    maxChannels: 8,
    maxVideoHeight: 2160,
    maxVideoWidth: 3840,
  });
}
