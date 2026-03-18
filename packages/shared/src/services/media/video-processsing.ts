import { Context, Effect, Layer } from "effect";
import { VideoProcessingJob } from "../../lib/queues/video-processing-job";
import { UndefinedError } from "../../lib/utils/undefined-error";
import { VideoCreationStatus } from "../../lib/video/video-status";
import { DBError } from "../db/db-errors";
import { FileSystem } from "../file-system/file-system";
import { S3Client } from "../s3/s3-client";
import { withTempVideoFile } from "./media-utils";
import { VideoRepository } from "./video-repository";

export interface VideoProcessingService {
  processVideo(
    data: VideoProcessingJob,
  ): Effect.Effect<void, UndefinedError | DBError>;
}

export class VideoProcessing extends Context.Tag("VideoProcessing")<
  VideoProcessing,
  VideoProcessingService
>() {}

export const VideoProcessingLive = Layer.effect(
  VideoProcessing,
  Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const fs = yield* FileSystem;
    const s3 = yield* S3Client;

    return {
      processVideo: (data: VideoProcessingJob) =>
        Effect.scoped(
          Effect.gen(function* () {
            // 1. Update status to PROCESSING,
            yield* videoRepo.update({
              id: data.payload.id,
              data: { creationStatus: VideoCreationStatus.PROCESSING },
            });

            // 2. Fetch metadata from previous validation steps,

            // const metadata = yield* videoRepo.getMetadata(data.payload.id);
            const video = yield* s3.getFile(data.payload.videoId, "temp-video");

            return yield* withTempVideoFile(
              fs,
              data.payload.videoId,
              video,
            ).pipe(
              Effect.flatMap((path) => {
                // 3. Create sub resolution,

                // 4. Normalize video,

                // 5. Generate ABR renditions,

                // 6. Transcode to HLS/DASH using CMAF,

                // 7. Create thumbnails from low resolution video,

                // 8. Generate storyboard (VTT),

                // 9. Write original, segments, manifest, thumbnails, storyboard to s3,

                // 10. Update video status to ready,

                // 11. Delete temp files,

                return Effect.void;
              }),
            );
          }).pipe(
            Effect.tap(
              Effect.gen(function* () {
                yield* videoRepo.update({
                  id: data.payload.id,
                  data: { creationStatus: VideoCreationStatus.COMPLETED },
                });
              }),
            ),
            Effect.catchAll(() =>
              Effect.gen(function* () {
                yield* videoRepo.update({
                  id: data.payload.id,
                  data: { creationStatus: VideoCreationStatus.FAILED },
                });
              }),
            ),
          ),
        ),
    };
  }),
);
