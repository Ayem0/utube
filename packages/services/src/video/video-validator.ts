import {
  VideoMetadata,
  VideoMetadataAudioStreamSchema,
  VideoMetadataSchema,
  VideoMetadataVideoStreamSchema,
  type VideoMetadataAudioStream,
  type VideoMetadataFormat,
  type VideoMetadataFormatValidated,
  type VideoMetadataValidated,
  type VideoMetadataVideoStream,
  type VideoValidateResult,
} from "@repo/types/effect/schemas";
import { Context, Effect, Layer, Schema, Stream } from "effect";
import type { PlatformError } from "effect/PlatformError";
import { ChildProcess } from "effect/process";
import type { ChildProcessSpawner } from "effect/process/ChildProcessSpawner";
import type { Scope } from "effect/Scope";
import { MediaValidatorConfig } from "../media/media-validator-config";

interface VideoValidatorService {
  validateVideo: (
    input: string,
  ) => Effect.Effect<
    VideoValidateResult,
    PlatformError,
    ChildProcessSpawner | Scope
  >;
}

export class VideoValidator extends Context.Service<
  VideoValidator,
  VideoValidatorService
>()("VideoValidator", {
  make: Effect.gen(function* () {
    const mediaConfig = yield* MediaValidatorConfig;
    const findValidVideoStream = Effect.fn(function* (
      streams: VideoMetadataVideoStream[],
    ) {
      const validStreams = (yield* Effect.filter(
        streams,
        validateVideoStream,
      )).sort((a, b) => b.width * b.height - a.height * a.width);

      return (
        validStreams.find((s) => s.disposition?.default === true) ??
        validStreams[0]
      );
    });

    // TODO see if i should validate more
    const validateVideoStream = Effect.fn(function* (
      stream: VideoMetadataVideoStream,
    ) {
      if (!mediaConfig.allowedVideoCodecs.includes(stream.codec_name)) {
        return false;
      }

      if (
        stream.width < mediaConfig.minVideoWidth ||
        stream.height < mediaConfig.minVideoHeight
      ) {
        return false;
      }
      const dimensions: [number, number] = [stream.width, stream.height];

      const [shortSide, longSide] = dimensions.sort((a, b) => a - b);

      if (
        shortSide > mediaConfig.maxVideoHeight ||
        longSide > mediaConfig.maxVideoWidth
      ) {
        return false;
      }

      if (stream.fps > mediaConfig.maxVideoFps) {
        return false;
      }

      return true;
    });

    const validateAudioStream = Effect.fn(function* (
      stream: VideoMetadataAudioStream,
    ) {
      if (!mediaConfig.allowedAudioCodecs.includes(stream.codec_name))
        return false;

      if (stream.channels > mediaConfig.maxChannels) return false;

      if (
        stream.sample_rate > mediaConfig.maxSampleRate ||
        stream.sample_rate < mediaConfig.minSampleRate
      )
        return false;

      return true;
    });

    const findValidAudioStream = Effect.fn(function* (
      streams: VideoMetadataAudioStream[],
    ) {
      const validStreams = (yield* Effect.filter(
        streams,
        validateAudioStream,
      )).sort((a, b) => b.channels - a.channels);
      return (
        validStreams.find((s) => s.disposition?.default === true) ??
        validStreams[0]
      );
    });

    const validateMetadata: (
      metadata: VideoMetadata,
    ) => Effect.Effect<
      | { valid: true; metadata: VideoMetadataValidated }
      | { valid: false; reason: string }
    > = Effect.fn(function* (metadata: VideoMetadata) {
      if (!metadata.streams || !metadata.format)
        return { valid: false, reason: "Invalid file metadata." };

      const format = yield* validateVideoMetadataFormat(metadata.format);
      if (!format.valid) {
        return {
          valid: false,
          reason: format.reason,
        };
      }

      const videoStreams = metadata.streams.filter(
        Schema.is(VideoMetadataVideoStreamSchema),
      );
      const videoStream = yield* findValidVideoStream(videoStreams);
      if (!videoStream) {
        return { valid: false, reason: "No valid video stream found." };
      }

      const audioStreams = metadata.streams.filter(
        Schema.is(VideoMetadataAudioStreamSchema),
      );

      const audioStream = yield* findValidAudioStream(audioStreams);

      if (audioStreams.length > 0 && !audioStream) {
        return {
          valid: false,
          reason: "No valid audio stream found.",
        };
      }

      return {
        valid: true,
        metadata: {
          videoStream: videoStream,
          audioStream,
          format: format.format,
        },
      };
    });

    const validateVideoMetadataFormat: (
      format: VideoMetadataFormat,
    ) => Effect.Effect<
      | { valid: true; format: VideoMetadataFormatValidated }
      | { valid: false; reason: string }
    > = Effect.fn(function* (format: VideoMetadataFormat) {
      if (!format.format_name)
        return {
          valid: false,
          reason: "No video format found.",
        };

      const formats = format.format_name.split(",");
      if (!formats.some((f) => mediaConfig.allowedVideoFormats.includes(f)))
        return {
          valid: false,
          reason: "Formats not supported.",
        };

      if (
        format.duration > mediaConfig.maxVideoSeconds ||
        format.duration < mediaConfig.minVideoSeconds
      )
        return {
          valid: false,
          reason: "Invalid video duration",
        };

      if (!format.size || format.size > mediaConfig.maxVideoBytes)
        return {
          valid: false,
          reason: "Couldnt read video size or too large.",
        };

      return {
        valid: true,
        format: {
          size: format.size,
          duration: format.duration,
          format_name: format.format_name,
          bit_rate: format.bit_rate,
        },
      };
    });

    return {
      validateVideo: Effect.fn(function* (input) {
        const spawn = yield* ChildProcess.make(
          "ffprobe",
          [
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_streams",
            "-show_format",
            input,
          ],
          {
            stderr: "pipe",
            stdout: "pipe",
          },
        );
        const [exitCode, stdout, stderr] = yield* Effect.all(
          [
            spawn.exitCode,
            spawn.stdout.pipe(Stream.decodeText, Stream.mkString),
            spawn.stderr.pipe(Stream.decodeText, Stream.mkString),
          ],
          { concurrency: "unbounded" },
        );

        if (exitCode !== 0) {
          yield* Effect.log("Error probing video :", stderr);
          return {
            valid: false,
            reason: "Error reading file metadata.",
          } satisfies VideoValidateResult;
        }

        const metadata = yield* Schema.decodeUnknownEffect(VideoMetadataSchema)(
          stdout,
        ).pipe(Effect.catch((_) => Effect.succeed(null)));

        if (!metadata) {
          return {
            valid: false,
            reason: "Error reading file metadata",
          } satisfies VideoValidateResult;
        }
        console.log("metadata", JSON.stringify(metadata));

        const validationResult = yield* validateMetadata(metadata);
        if (!validationResult.valid)
          return {
            valid: false,
            reason: validationResult.reason,
          };

        return {
          valid: true,
          metadata: validationResult.metadata,
        };
      }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(MediaValidatorConfig.Layer),
  );
}
