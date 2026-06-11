import { video as videoTable } from "@repo/db/schema";
import { VideoCreationStatus } from "@repo/types/enums/video/video-status";
import type { VideoProcessingJob } from "@repo/types/types/video-processing-job";
import { Context, Effect, Layer } from "effect";
import { DBError, DBNotFoundError } from "../db/db-errors";
import { InvalidMediaFileNameError } from "../media/media-errors";
import type { QueueError } from "../queue/queue-errors";
import { SnsClient } from "../queue/sns-client";
import { S3Client } from "../s3/s3-client";
import { S3Error } from "../s3/s3-errors";
import { VideoUploadError } from "./video-errors";
import { VideoRepository } from "./video-repository";

export class VideoPublisher extends Context.Tag("VideoPublisher")<
  VideoPublisher,
  VideoPublisherService
>() {}

type Video = typeof videoTable.$inferSelect;
export interface VideoPublisherService {
  // publishVideo: (
  //   channelId: string,
  //   title: string,
  //   description: string,
  //   image: File,
  //   video: File,
  // ) => Effect.Effect<
  //   Video,
  //   | InvalidMediaTypeError
  //   | InvalidMediaSizeError
  //   | DBError
  //   | DBNotFoundError
  //   | S3Error
  //   | QueueError
  // >;
  createDraft: (
    channelId: string,
    fileName: string,
  ) => Effect.Effect<
    { videoId: string; presignedUrl: string; title: string },
    S3Error | DBError | DBNotFoundError | InvalidMediaFileNameError,
    never
  >;

  uploadVideoThumbnail: (
    channelId: string,
    videoId: string,
    fileName: string,
  ) => Effect.Effect<
    { presignedUrl: string },
    | S3Error
    | DBError
    | DBNotFoundError
    | VideoUploadError
    | InvalidMediaFileNameError,
    never
  >;

  uploadedVideo: (
    channelId: string,
    videoId: string,
  ) => Effect.Effect<
    void,
    S3Error | DBError | DBNotFoundError | VideoUploadError | QueueError,
    never
  >;

  // publishVideo: (
  //   channelId: string,
  //   videoId: string,
  //   data: {
  //     title: string;
  //     description: string | undefined;
  //     visibility: VideoVisibility;
  //   },
  // ) => Effect.Effect<void, S3Error | DBError | DBNotFoundError, never>;
}

export const VideoPublisherLive = Layer.effect(
  VideoPublisher,
  Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const s3Client = yield* S3Client;
    // const mediaValidator = yield* MediaValidator;
    // const queueClient = yield* QueueClient;
    const snsClient = yield* SnsClient;
    return {
      // publishVideo: (
      //   channelId: string,
      //   title: string,
      //   description: string,
      //   image: File,
      //   video: File,
      // ) =>
      //   Effect.scoped(
      //     Effect.gen(function* () {
      //       // const { type: imgType } =
      //       //   yield* mediaValidator.prevalidateImage(image);
      //       // const { type: videoType } =
      //       //   yield* mediaValidator.prevalidateVideo(video);
      //       const imageId = `${crypto.randomUUID()}.${image.type.slice("image/".length)}`;
      //       const videoId = `${crypto.randomUUID()}.${video.type.slice("video/".length)}`;

      //       const bucketImg = "temp-image";
      //       const bucketVideo = "temp-video";

      //       yield* Effect.acquireRelease(
      //         s3Client.uploadFile(videoId, video, bucketVideo),
      //         (_, exit) =>
      //           Exit.isFailure(exit)
      //             ? s3Client.deleteFile(videoId, bucketVideo).pipe(
      //                 Effect.catchAll((e) => {
      //                   console.log(e);
      //                   return Effect.void;
      //                 }),
      //               )
      //             : Effect.void,
      //       );

      //       yield* Effect.acquireRelease(
      //         s3Client.uploadFile(imageId, image, bucketImg),
      //         (_, exit) =>
      //           Exit.isFailure(exit)
      //             ? s3Client.deleteFile(imageId, bucketImg).pipe(
      //                 Effect.catchAll((e) => {
      //                   console.log(e);
      //                   return Effect.void;
      //                 }),
      //               )
      //             : Effect.void,
      //       );

      //       const created = yield* Effect.acquireRelease(
      //         videoRepo.create({
      //           channelId,
      //           title,
      //           description,
      //           tempVideoKey: videoId,
      //           tempThumbnailKey: imageId,
      //         }),
      //         (row, exit) =>
      //           Exit.isFailure(exit)
      //             ? videoRepo.delete(row.id).pipe(
      //                 Effect.catchAll((e) => {
      //                   console.log(e);
      //                   return Effect.void;
      //                 }),
      //               )
      //             : Effect.void,
      //       );

      //       const message: VideoProcessingJob = {
      //         rowId: created.id,
      //         imageKey: imageId,
      //         videoKey: videoId,
      //       };
      //       yield* snsClient.send(
      //         process.env.VIDEO_PROCESSING_TOPIC_ARN!,
      //         message,
      //       );
      //       return created;
      //     }),
      //   ),
      createDraft: (channelId, fileName) =>
        Effect.gen(function* () {
          console.log("FILE NAME", fileName);
          const parts = fileName.split(".");
          if (parts.length < 2)
            return yield* new InvalidMediaFileNameError({
              message: `Invalid file name : "${fileName}"`,
            });
          const fileTitle = parts.length > 0 ? parts[0]! : "Title";
          const videoId = crypto.randomUUID();
          const videoKey = `${channelId}/${videoId}/original.${fileName.split(".").pop()}`;
          const presignedUrl = yield* s3Client.getPresignedUrl(
            videoKey,
            "video",
          );

          const created = yield* videoRepo.create({
            channelId,
            videoId,
            tempVideoKey: videoKey,
            title: fileTitle,
          });

          return { videoId: created.id, presignedUrl, title: fileTitle };
        }),
      uploadedVideo: (channelId, videoId) =>
        Effect.gen(function* () {
          const videoKey = yield* videoRepo.getTempVideoKeyById(
            channelId,
            videoId,
          );
          const exists = yield* s3Client.exists(videoKey, "temp-video");
          if (!exists) {
            yield* videoRepo.delete(videoId);
            return yield* new VideoUploadError({
              message: "Video file not uploaded, try again.",
            });
          }

          yield* videoRepo.update(videoId, {
            creationStatus: VideoCreationStatus.UPLOADED,
          });
          const message: VideoProcessingJob = {
            rowId: videoId,
            videoKey: videoKey,
          };
          yield* snsClient.send(
            process.env.VIDEO_PROCESSING_TOPIC_ARN!,
            message,
          );

          return;
        }),

      uploadVideoThumbnail: (channelId, videoId, fileName) =>
        Effect.gen(function* () {
          let thumbnailKey = yield* videoRepo.getTempThumbnailKeyById(
            channelId,
            videoId,
          );
          if (thumbnailKey) {
            yield* s3Client.deleteFile(thumbnailKey, "temp-video");
          }
          const parts = fileName.split(".");
          if (parts.length < 2)
            return yield* new InvalidMediaFileNameError({
              message: `Invalid file name : "${fileName}"`,
            });

          thumbnailKey = crypto.randomUUID() + "." + fileName.split(".").pop();
          const presignedUrl = yield* s3Client.getPresignedUrl(
            thumbnailKey,
            "image",
          );

          return { presignedUrl };
        }),
      publishVideo: (channelId, videoId, data) =>
        Effect.gen(function* () {
          const video = yield* videoRepo.getTempVideoKeyById(videoId);
          if (video.channelId !== channelId)
            return yield* new VideoUploadError({
              message: "Video not found or unauthorized",
            });
          yield* videoRepo.update(videoId, {
            creationStatus: VideoCreationStatus.PUBLISHED,
          });
        }),
    };
  }),
);
