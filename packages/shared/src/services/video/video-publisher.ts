import { Context, Effect, Exit, Layer } from "effect";
import { VideoValidationJob } from "../../lib/queues/video-validation-job";
import { videoValidationQueue } from "../../queues/video-validation-queue";
import { MediaValidator } from "../media/media-validator";
import { QueueClient } from "../queue/queue";
import { S3Client } from "../s3/s3-client";
import { VideoRepository } from "./video-repository";

export class VideoPublisher extends Context.Tag("VideoPublisher")<
  VideoPublisher,
  VideoPublisher.Service
>() {}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace VideoPublisher {
  export const makeLive = () => ({
    publishVideo: (
      userId: string,
      title: string,
      description: string,
      image: File,
      video: File,
    ) =>
      Effect.scoped(
        Effect.gen(function* () {
          const videoRepo = yield* VideoRepository;
          const fileStorage = yield* S3Client;
          const mediaValidator = yield* MediaValidator;
          const queueClient = yield* QueueClient;
          const id = crypto.randomUUID();

          const { type: imgType } = yield* mediaValidator.validateImage(image);
          const { type: videoType } =
            yield* mediaValidator.validateVideo(video);
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
              userId,
              title,
              description,
              url: videoId,
              thumbnail: imageId,
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
              imageId: created.thumbnail,
              videoId: created.url,
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
  });

  export type Service = ReturnType<typeof makeLive>;
  export const Live = Layer.succeed(VideoPublisher, VideoPublisher.makeLive());
}
