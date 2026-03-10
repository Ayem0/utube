import { Context, Effect, Layer } from "effect";
import { VideoValidationJob } from "../../lib/queues/video-validation-job";
import { UndefinedError } from "../../lib/utils/undefined-error";
import { VideoCreationStatus } from "../../lib/video/video-status";
import { DBError } from "../db/db-errors";
import { FileSystem, FileSystemService } from "../file-system/file-system";
import { FSError } from "../file-system/file-system-errors";
import { S3Client } from "../s3/s3-client";
import { S3Error } from "../s3/s3-errors";
import {
  VideoRepository,
  VideoRepositoryService,
} from "../video/video-repository";
import {
  InvalidMediaSizeError,
  InvalidMediaTypeError,
  InvalidVideoError,
} from "./media-errors";
import {
  MediaValidatorConfig,
  MediaValidatorConfigService,
} from "./media-validator-config";

export class MediaValidator extends Context.Tag("MediaValidator")<
  MediaValidator,
  MediaValidatorService
>() {}

export interface MediaValidatorService {
  readonly prevalidateImage: (
    image: File,
  ) => Effect.Effect<
    { size: number; type: string },
    InvalidMediaTypeError | InvalidMediaSizeError
  >;
  readonly prevalidateVideo: (
    video: File,
  ) => Effect.Effect<
    { size: number; type: string },
    InvalidMediaTypeError | InvalidMediaSizeError
  >;
  readonly validateVideo: (
    data: VideoValidationJob,
  ) => Effect.Effect<
    void,
    InvalidVideoError | FSError | S3Error | UndefinedError | DBError
  >;
}

export const MediaValidatorLive = Layer.effect(
  MediaValidator,
  Effect.gen(function* () {
    const cfg = yield* MediaValidatorConfig;
    const s3 = yield* S3Client;
    const videoRepo = yield* VideoRepository;
    const fs = yield* FileSystem;

    return {
      prevalidateImage: (image: File) =>
        Effect.gen(function* () {
          if (!cfg.allowedImageTypes.includes(image.type)) {
            return yield* Effect.fail(
              new InvalidMediaTypeError({ message: "Invalid media type" }),
            );
          }
          if (image.size > cfg.maxImageBytes) {
            return yield* Effect.fail(
              new InvalidMediaSizeError({ message: "Invalid media size" }),
            );
          }
          return {
            size: image.size,
            type: image.type,
          };
        }),
      prevalidateVideo: (video: File) =>
        Effect.gen(function* () {
          if (!cfg.allowedVideoTypes.includes(video.type)) {
            return yield* Effect.fail(
              new InvalidMediaTypeError({ message: "Invalid media type" }),
            );
          }
          if (video.size > cfg.maxVideoBytes) {
            return yield* Effect.fail(
              new InvalidMediaSizeError({ message: "Invalid media size" }),
            );
          }
          return {
            size: video.size,
            type: video.type,
          };
        }),
      validateVideo: (data: VideoValidationJob) =>
        Effect.scoped(
          Effect.gen(function* () {
            yield* videoRepo.update({
              id: data.payload.id,
              status: VideoCreationStatus.VALIDATING,
            });

            const video = yield* s3.getFile(data.payload.videoId, "temp-video");

            yield* runValidation(cfg, fs, data.payload.videoId, video);
          }).pipe(
            Effect.tap(
              updateDbStatus(
                data.payload.id,
                VideoCreationStatus.VALIDATED,
                videoRepo,
              ),
            ),
            Effect.catchAll(() =>
              updateDbStatus(
                data.payload.id,
                VideoCreationStatus.VALIDATION_FAILED,
                videoRepo,
              ),
            ),
          ),
        ),
    };
  }),
);

const updateDbStatus = (
  id: string,
  status: VideoCreationStatus,
  videoRepo: VideoRepositoryService,
) =>
  Effect.gen(function* () {
    yield* videoRepo.update({
      id: id,
      status: status,
    });
  });

const validateVideoMetadata = (
  cfg: MediaValidatorConfigService,
  metadata: any,
) =>
  Effect.gen(function* () {
    const videoStream = metadata.streams.find(
      (s: any) => s.codec_type === "video",
    );

    if (!videoStream) {
      return yield* new InvalidVideoError({
        cause: "No video stream",
        message: "No video stream found",
      });
    }

    const width = videoStream.width;
    const height = videoStream.height;

    const [num, den] = videoStream.r_frame_rate.split("/");
    const fps = Number(num) / Number(den);

    const duration = Number(metadata.format.duration);

    if (width * height > cfg.maxVideoResolution) {
      return yield* new InvalidVideoError({
        cause: "Resolution too high",
        message: `${width}x${height}`,
      });
    }

    if (fps > cfg.maxVideoFps) {
      return yield* new InvalidVideoError({
        cause: "FPS too high",
        message: `${fps}`,
      });
    }

    if (duration > cfg.maxVideoSeconds) {
      return yield* new InvalidVideoError({
        cause: "Duration too long",
        message: `${duration}`,
      });
    }
    return;
  });

const withTempVideoFile = (
  fs: FileSystemService,
  videoId: string,
  buffer: Bun.S3File,
) =>
  Effect.acquireRelease(fs.writeFile(`/tmp/${videoId}`, buffer), (path) =>
    fs.deleteFile(path).pipe(Effect.catchAll(() => Effect.void)),
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

      const text = await new Response(proc.stdout).text();
      return JSON.parse(text);
    },
    catch: (e) =>
      new InvalidVideoError({
        cause: e,
        message: "Error reading metadata",
      }),
  });

const runValidation = (
  cfg: MediaValidatorConfigService,
  fs: FileSystemService,
  videoId: string,
  video: Bun.S3File,
) =>
  withTempVideoFile(fs, videoId, video).pipe(
    Effect.flatMap(probeVideo),
    Effect.flatMap((output) => validateVideoMetadata(cfg, output)),
  );
