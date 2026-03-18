import { Context, Effect, Exit, Layer } from "effect";
import { video as videoTable } from "../../db/schema";
import { VideoValidationJob } from "../../lib/queues/video-validation-job";
import { UndefinedError } from "../../lib/utils/undefined-error";
import { videoValidationQueue } from "../../queues/video-validation-queue";
import { DBError } from "../db/db-errors";
import { QueueClient } from "../queue/queue";
import { QueueError } from "../queue/queue-errors";
import { S3Client } from "../s3/s3-client";
import { S3Error } from "../s3/s3-errors";
import { InvalidMediaSizeError, InvalidMediaTypeError } from "./media-errors";
import { MediaValidator } from "./media-validator";
import { VideoRepository } from "./video-repository";

export class VideoPublisher extends Context.Tag("VideoPublisher")<
  VideoPublisher,
  VideoPublisherService
>() {}

type Video = typeof videoTable.$inferSelect;
export interface VideoPublisherService {
  publishVideo: (
    channelId: string,
    title: string,
    description: string,
    image: File,
    video: File,
  ) => Effect.Effect<
    Video,
    | InvalidMediaTypeError
    | InvalidMediaSizeError
    | UndefinedError
    | DBError
    | S3Error
    | QueueError
  >;
}

const makeLive = () =>
  Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const fileStorage = yield* S3Client;
    const mediaValidator = yield* MediaValidator;
    const queueClient = yield* QueueClient;
    return {
      publishVideo: (
        channelId: string,
        title: string,
        description: string,
        image: File,
        video: File,
      ) =>
        Effect.scoped(
          Effect.gen(function* () {
            const id = crypto.randomUUID();

            const { type: imgType } =
              yield* mediaValidator.prevalidateImage(image);
            const { type: videoType } =
              yield* mediaValidator.prevalidateVideo(video);
            const imageId = `${id}-image.${imgType.slice("image/".length)}`;
            const videoId = `${id}-video.${videoType.slice("video/".length)}`;

            const bucketImg = "temp-image";
            const bucketVideo = "temp-video";

            yield* Effect.acquireRelease(
              fileStorage.uploadFile(videoId, video, bucketVideo),
              (_, exit) =>
                Exit.isFailure(exit)
                  ? fileStorage.deleteFile(videoId, bucketVideo).pipe(
                      Effect.catchAll((e) => {
                        console.log(e);
                        return Effect.void;
                      }),
                    )
                  : Effect.void,
            );

            yield* Effect.acquireRelease(
              fileStorage.uploadFile(imageId, image, bucketImg),
              (_, exit) =>
                Exit.isFailure(exit)
                  ? fileStorage.deleteFile(imageId, bucketImg).pipe(
                      Effect.catchAll((e) => {
                        console.log(e);
                        return Effect.void;
                      }),
                    )
                  : Effect.void,
            );

            const created = yield* Effect.acquireRelease(
              videoRepo.create({
                id,
                channelId,
                title,
                description,
                tempVideoKey: videoId,
                tempThumbnailKey: imageId,
              }),
              (_, exit) =>
                Exit.isFailure(exit)
                  ? videoRepo.delete(id).pipe(
                      Effect.catchAll((e) => {
                        console.log(e);
                        return Effect.void;
                      }),
                    )
                  : Effect.void,
            );

            const videoValidationJob: VideoValidationJob = {
              id: crypto.randomUUID(),
              payload: {
                id: created.id,
                imageId: created.tempThumbnailKey,
                videoId: created.tempVideoKey,
              },
              type: "video-validation",
            };

            yield* queueClient.send(
              videoValidationQueue,
              videoValidationJob.type,
              videoValidationJob,
            );
            return created;
          }),
        ),
    };
  });

export const VideoPublisherLive = Layer.effect(VideoPublisher, makeLive());
