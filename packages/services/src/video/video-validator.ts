import { Context, Effect, Layer, Schema } from "effect";
import { ParseError } from "effect/ParseResult";
import { MediaValidatorConfig } from "../media/media-validator-config";
import { VideoMetadata, videoMetadataSchema } from "./video";
import { VideoValidationError } from "./video-errors";

interface VideoValidatorService {
  validateVideo: (
    path: string,
  ) => Effect.Effect<
    { rawMetadata: VideoMetadata; parsedFPS: number },
    VideoValidationError | ParseError,
    never
  >;
}

export class VideoValidator extends Context.Tag("VideoValidator")<
  VideoValidator,
  VideoValidatorService
>() {}

export const VideoValidatorLive = Layer.effect(
  VideoValidator,
  Effect.gen(function* () {
    const mediaConfig = yield* MediaValidatorConfig;
    return {
      validateVideo: (path) =>
        Effect.gen(function* () {
          const metadata = yield* probeVideo(path);
          console.log("metadata", JSON.stringify(metadata));
          const { parsedFPS } = yield* validateMetadata(mediaConfig, metadata);
          return { rawMetadata: metadata, parsedFPS: parsedFPS };
        }),
    };
  }),
);

const probeVideo = (path: string) =>
  Effect.tryPromise({
    try: async () => {
      const proc = Bun.spawn(
        [
          "ffprobe",
          "-v",
          "error",
          "-print_format",
          "json",
          "-show_streams",
          "-show_format",
          path,
        ],
        { stdout: "pipe", stderr: "pipe" },
      );

      const metadata = await new Response(proc.stdout).json();
      console.log("REAL RAW METADATA", JSON.stringify(metadata));
      return Schema.decodeUnknownSync(videoMetadataSchema)(metadata);
    },
    catch: (e) =>
      new VideoValidationError({
        cause: e,
        message: "Error reading metadata",
      }),
  });

const validateMetadata = (
  cfg: MediaValidatorConfig["Type"],
  metadata: VideoMetadata,
) =>
  Effect.gen(function* () {
    if (!metadata.streams) {
      return yield* new VideoValidationError({
        cause: "No streams",
        message: "No streams found",
      });
    }

    if (!metadata.format) {
      return yield* new VideoValidationError({
        cause: "No format",
        message: "No format found",
      });
    }

    if (!metadata.format.size) {
      return yield* new VideoValidationError({
        cause: "No size",
        message: "No size found",
      });
    }

    if (metadata.format.size > cfg.maxVideoBytes) {
      return yield* new VideoValidationError({
        cause: `Size ${metadata.format.size} exceeds ${cfg.maxVideoBytes} bytes`,
        message: "Size too large",
      });
    }

    if (!metadata.format.format_name) {
      return yield* new VideoValidationError({
        cause: "No format name",
        message: "No format name found",
      });
    }

    const formats = metadata.format.format_name.split(",");

    if (!cfg.allowedVideoTypes.some((f) => formats.includes(f))) {
      return yield* new VideoValidationError({
        cause: `Format ${metadata.format.format_name} not allowed`,
        message: "Format not allowed",
      });
    }

    if (!metadata.format.duration) {
      return yield* new VideoValidationError({
        cause: "Invalid duration",
        message: "Invalid duration",
      });
    }

    if (metadata.format.duration > cfg.maxVideoSeconds) {
      return yield* new VideoValidationError({
        cause: `Duration ${metadata.format.duration} exceeds ${cfg.maxVideoSeconds} seconds`,
        message: "Duration too long",
      });
    }

    const { parsedFPS } = yield* validateVideoStream(cfg, metadata.streams);
    yield* validateAudioStream(cfg, metadata.streams);

    return { rawMetadata: metadata, parsedFPS: parsedFPS };
  });

const validateVideoStream = (
  cfg: MediaValidatorConfig["Type"],
  streams: VideoMetadata["streams"],
) =>
  Effect.gen(function* () {
    // Extract video stream with highest resolution
    const videoStream = streams
      ?.filter((s) => s.codec_type === "video")
      .sort(
        (a, b) =>
          (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0),
      )[0];

    if (!videoStream) {
      return yield* new VideoValidationError({
        cause: "No video stream",
        message: "No video stream found",
      });
    }

    const codecName = videoStream.codec_name;
    if (!codecName) {
      return yield* new VideoValidationError({
        cause: "Invalid codec name",
        message: "Invalid codec name",
      });
    }

    if (!cfg.allowedVideoCodecs.includes(codecName)) {
      return yield* new VideoValidationError({
        cause: "Codec not allowed",
        message: `Codec ${codecName} not allowed`,
      });
    }

    const width = videoStream.width;
    const height = videoStream.height;
    const frameRate = videoStream.avg_frame_rate;
    if (!frameRate) {
      return yield* new VideoValidationError({
        cause: "Invalid FPS",
        message: "Invalid FPS",
      });
    }
    const fps = parseFps(frameRate);
    if (!Number.isFinite(fps) || fps <= 0 || fps > cfg.maxVideoFps) {
      return yield* new VideoValidationError({
        cause: `FPS ${frameRate} not in range 1-${cfg.maxVideoFps}`,
        message: "Invalid frame rate",
      });
    }

    if (!width || !height) {
      return yield* new VideoValidationError({
        cause: "Invalid resolution",
        message: "Invalid resolution",
      });
    }

    if (width < cfg.minVideoWidth || height < cfg.minVideoHeight) {
      return yield* new VideoValidationError({
        cause: "Resolution too low",
        message: "Resolution too low",
      });
    }

    if (width * height > cfg.maxVideoResolution) {
      return yield* new VideoValidationError({
        cause: "Resolution too high",
        message: "Resolution too high",
      });
    }

    return { parsedFPS: fps };
  });

const validateAudioStream = (
  cfg: MediaValidatorConfig["Type"],
  streams: VideoMetadata["streams"],
) =>
  Effect.gen(function* () {
    const audioStream = streams?.filter((s) => s.codec_type === "audio")[0];

    if (!audioStream) return;

    const codecName = audioStream.codec_name;
    if (!codecName) {
      return yield* new VideoValidationError({
        cause: "Invalid codec name",
        message: "Invalid codec name",
      });
    }

    if (!cfg.allowedAudioCodecs.includes(codecName)) {
      return yield* new VideoValidationError({
        cause: "Codec not allowed",
        message: `Codec ${codecName} not allowed`,
      });
    }

    const sampleRate = audioStream.sample_rate;
    const channels = audioStream.channels;

    if (!sampleRate || !channels) {
      return yield* new VideoValidationError({
        cause: "Invalid audio stream",
        message: "Invalid audio stream",
      });
    }

    if (
      sampleRate < cfg.minimumSampleRate ||
      sampleRate > cfg.maximumSampleRate
    ) {
      return yield* new VideoValidationError({
        cause: `Sample rate ${sampleRate} not in range ${cfg.minimumSampleRate}-${cfg.maximumSampleRate}`,
        message: "Invalid sample rate",
      });
    }

    if (channels < cfg.minimumChannels || channels > cfg.maximumChannels) {
      return yield* new VideoValidationError({
        cause: `Channels ${channels} not in range ${cfg.minimumChannels}-${cfg.maximumChannels}`,
        message: "Invalid channels",
      });
    }
  });

const parseFps = (rate: string) => {
  const [num, den] = rate.split("/").map(Number);
  if (!num || !den) return 0;
  return num / den;
};
