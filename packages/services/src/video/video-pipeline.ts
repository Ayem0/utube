import { VideoCreationStatus } from "@repo/types/enums/video/video-status";
import { VideoProcessingJob } from "@repo/types/types/video-processing-job";
import { Context, Effect, Layer } from "effect";
import { ParseError } from "effect/Cron";
import { DBError, DBNotFoundError } from "../db/db-errors";
import { FileSystem } from "../file-system/file-system";
import { FSError } from "../file-system/file-system-errors";
import { S3Client } from "../s3/s3-client";
import { S3Error } from "../s3/s3-errors";
import { VideoProcessingError, VideoValidationError } from "./video-errors";
import { VideoProcessor } from "./video-processor";
import { VideoRepository } from "./video-repository";
import { VideoStoryboardGenerator } from "./video-storyboard-generator";
import { VideoValidator } from "./video-validator";

export interface VideoPipelineService {
  processVideo(
    data: VideoProcessingJob,
  ): Effect.Effect<
    void,
    | DBError
    | DBNotFoundError
    | S3Error
    | FSError
    | VideoValidationError
    | ParseError
    | VideoProcessingError
  >;
}

export class VideoPipeline extends Context.Tag("VideoPipeline")<
  VideoPipeline,
  VideoPipelineService
>() {}

export const VideoPipelineLive = Layer.effect(
  VideoPipeline,
  Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const fs = yield* FileSystem;
    const s3 = yield* S3Client;
    const videoValidator = yield* VideoValidator;
    const storyboardGenerator = yield* VideoStoryboardGenerator;
    const videoProcessor = yield* VideoProcessor;
    return {
      processVideo: (data: VideoProcessingJob) =>
        Effect.scoped(
          Effect.gen(function* () {
            // 1. Update status to VALIDATING,
            yield* videoRepo.update(data.rowId, {
              creationStatus: VideoCreationStatus.VALIDATING,
            });
            // 2. Fetch video from s3
            const video = yield* s3.getFile(data.videoKey, "temp-video");
            // 3. Write file to disk and perform validation + processing
            return yield* withTempVideoFile(fs, data.videoKey, video).pipe(
              Effect.flatMap((originalPath) =>
                Effect.gen(function* () {
                  // 4. Validate video
                  const { rawMetadata, parsedFPS, duration } =
                    yield* videoValidator.validateVideo(originalPath);
                  // 5. Update status to PROCESSING,
                  yield* videoRepo.update(data.rowId, {
                    creationStatus: VideoCreationStatus.PROCESSING,
                  });
                  // 6. Normalize video, transcode to sub resolutions, create HLS/DASH
                  const transcodeEntries = yield* videoProcessor.transcode(
                    originalPath,
                    data.rowId,
                    rawMetadata,
                    parsedFPS,
                    duration,
                  );
                  const storyboardEntries = yield* storyboardGenerator.generate(
                    originalPath,
                    data.rowId,
                    duration,
                  );
                  /* TODO: 
                  - Update ladder to db 
                  - Create thumbnails from low resolution video + storyboard (VTT),
                  - Write original, segments, manifest, thumbnails, storyboard to s3,
                  */
                  const entries = [...transcodeEntries, ...storyboardEntries];
                  yield* s3.uploadFiles(entries, "videos");
                  yield* videoRepo.update(data.rowId, {
                    hlsUrl: `http://localhost:8080/videos/${data.rowId}/master.m3u8`, // TODO replace with cdn url env variable
                    dashUrl: `http://localhost:8080/videos/${data.rowId}/manifest.mpd`, // TODO replace with cdn url env variable
                    storyboardUrl: `http://localhost:8080/videos/${data.rowId}/storyboard.vtt`, // TODO replace with cdn url env variable
                    duration: duration,
                  });
                  // 10. Delete temp files,
                  yield* fs.deleteDirectory(`/tmp/${data.rowId}`);
                  console.log("Video processed successfully", data.rowId);
                }),
              ),
            );
          }).pipe(
            Effect.tap(
              Effect.gen(function* () {
                yield* videoRepo.update(data.rowId, {
                  creationStatus: VideoCreationStatus.COMPLETED,
                });
              }),
            ),
            Effect.catchAll((error) =>
              Effect.gen(function* () {
                console.log("error", error);
                yield* videoRepo.update(data.rowId, {
                  creationStatus: VideoCreationStatus.FAILED,
                });
                return error;
              }),
            ),
          ),
        ),
    };
  }),
);

const withTempVideoFile = (
  fs: FileSystem["Type"],
  fileName: string,
  buffer: Bun.S3File,
) =>
  Effect.acquireRelease(fs.writeFile(`/tmp/${fileName}`, buffer), (path) =>
    fs.deleteFile(path).pipe(Effect.catchAll(() => Effect.void)),
  );
