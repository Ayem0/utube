import { video as videoTable } from "@repo/db/schema";
import { videoProcessingQueue } from "@repo/queues/video-processing-queue";
import { Context, Effect, Exit, Layer } from "effect";
import { DBError, DBNotFoundError } from "../db/db-errors";
import {
  InvalidMediaSizeError,
  InvalidMediaTypeError,
} from "../media/media-errors";
import { QueueClient } from "../queue/queue-client";
import { QueueError } from "../queue/queue-errors";
import { S3Client } from "../s3/s3-client";
import { S3Error } from "../s3/s3-errors";
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
    | DBError
    | DBNotFoundError
    | S3Error
    | QueueError
  >;
}

export const VideoPublisherLive = Layer.effect(
  VideoPublisher,
  Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const fileStorage = yield* S3Client;
    // const mediaValidator = yield* MediaValidator;
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
            // const { type: imgType } =
            //   yield* mediaValidator.prevalidateImage(image);
            // const { type: videoType } =
            //   yield* mediaValidator.prevalidateVideo(video);
            const imageId = `${crypto.randomUUID()}.${image.type.slice("image/".length)}`;
            const videoId = `${crypto.randomUUID()}.${video.type.slice("video/".length)}`;

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
                channelId,
                title,
                description,
                tempVideoKey: videoId,
                tempThumbnailKey: imageId,
              }),
              (row, exit) =>
                Exit.isFailure(exit)
                  ? videoRepo.delete(row.id).pipe(
                      Effect.catchAll((e) => {
                        console.log(e);
                        return Effect.void;
                      }),
                    )
                  : Effect.void,
            );

            yield* queueClient.send(
              videoProcessingQueue,
              "video-processing-job",
              {
                rowId: created.id,
                imageKey: created.tempThumbnailKey,
                videoKey: created.tempVideoKey,
              },
            );
            return created;
          }),
        ),
    };
  }),
);
