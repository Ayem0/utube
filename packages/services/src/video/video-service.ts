import type { Asset, Channel, Video, VideoPlayback } from "@repo/db/types";
import { assetType } from "@repo/types/enums/asset/asset-type";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import type { SqlError } from "effect/unstable/sql/SqlError";
import { AssetRepository } from "../asset/asset-repository";
import { AssetUploadFactory } from "../asset/asset-upload-factory";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";
import {
  InvalidMediaTypeError,
  type InvalidMediaSizeError,
} from "../media/media-errors";
import { S3 } from "../s3/s3";
import type { S3Error } from "../s3/s3-errors";
import { newId } from "../utils/id";
import { VideoRepository, type StudioVideo } from "./video-repository";

type WatchVideo = Pick<
  Video,
  "id" | "description" | "title" | "publishedAt" | "duration" | "visibility"
> & {
  channel: Pick<Channel, "alias" | "name"> & { variants: Asset["variants"] };
  hlsMasterUrl: string;
  dashManifestUrl: string;
  storyboardUrl: string;
  renditions: VideoPlayback["renditions"];
};

export interface VideoServiceApi {
  createDraft: (params: {
    userId: string;
    channelId: string;
    mimeType: string;
    filename: string;
    sizeBytes: number;
  }) => Effect.Effect<
    {
      videoId: string;
      assetId: string;
      presignedUrl: string;
      title: string;
    },
    | DBNotFoundError
    | InvalidMediaTypeError
    | EffectDrizzleQueryError
    | InvalidMediaSizeError
    | SqlError
    | S3Error
  >;

  getWatchById: (params: {
    id: string;
  }) => Effect.Effect<WatchVideo, DBNotFoundError | EffectDrizzleQueryError>;

  updateVideo: (params: {
    userId: string;
    channelId: string;
    videoId: string;
    data: Pick<Video, "title" | "description" | "visibility">;
  }) => Effect.Effect<
    StudioVideo,
    DBNotFoundError | InvalidMediaTypeError | EffectDrizzleQueryError
  >;
}

export class VideoService extends Context.Service<
  VideoService,
  VideoServiceApi
>()("VideoService", {
  make: Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const assetRepo = yield* AssetRepository;
    const db = yield* DB;
    const assetUploadFactory = yield* AssetUploadFactory;
    return {
      createDraft: ({ userId, channelId, filename, mimeType, sizeBytes }) =>
        Effect.gen(function* () {
          const title = filename.split(".")[0] ?? "Title";
          const videoId = newId();
          const assetId = newId();

          yield* assetUploadFactory.validate({
            mimeType,
            sizeBytes,
            assetType: assetType.VIDEO,
          });

          const storageKey = yield* assetUploadFactory.createAssetStorageKey({
            id: assetId,
            mimeType: mimeType,
            assetType: assetType.VIDEO,
          });

          const presignedUrl = yield* assetUploadFactory.getPresignedUrl({
            assetStorageKey: storageKey,
            mimeType: mimeType,
          });

          return yield* db.transaction((tx) =>
            Effect.gen(function* () {
              const asset = yield* assetRepo.create(
                {
                  id: assetId,
                  ownerUserId: userId,
                  originalStorageKey: storageKey,
                  sizeBytes: sizeBytes,
                  type: assetType.VIDEO,
                  mimeType: mimeType,
                },
                tx,
              );
              const video = yield* videoRepo.create(
                {
                  id: videoId,
                  channelId: channelId,
                  title: title,
                  sourceVideoAssetId: asset.id,
                },
                tx,
              );

              return {
                assetId: asset.id,
                videoId: video.id,
                presignedUrl: presignedUrl,
                title: video.title,
              };
            }),
          );
        }),
      updateVideo: ({ userId, channelId, videoId, data }) =>
        Effect.gen(function* () {
          const updated = yield* videoRepo.updateStudio({
            userId,
            channelId,
            videoId,
            data,
          });
          return updated;
        }),
      getWatchById: ({ id }) =>
        Effect.gen(function* () {
          const row = yield* videoRepo.getWatchById({ id });
          return {
            id: row.id,
            description: row.description,
            title: row.title,
            publishedAt: row.publishedAt,
            duration: row.duration,
            visibility: row.visibility,
            channel: {
              alias: row.channel.alias,
              name: row.channel.name,
              variants: row.channel.variants,
            },
            hlsMasterUrl: `http://localhost:8080/videos/${row.playback.hlsMasterKey}`, // TODO: replace with .env variable from a dedicated service
            dashManifestUrl: `http://localhost:8080/videos/${row.playback.dashManifestKey}`, // TODO: replace with .env variable from a dedicated service
            storyboardUrl: `http://localhost:8080/videos/${row.playback.storyboardKey}`, // TODO: replace with .env variable from a dedicated service
            renditions: row.playback.renditions,
          };
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(VideoRepository.Layer),
    Layer.provide(S3.Layer),
    Layer.provide(AssetRepository.Layer),
    Layer.provide(DB.Layer),
    Layer.provide(AssetUploadFactory.Layer),
  );
}

//   uploadVideoThumbnail: (
//     channelId: string,
//     videoId: string,
//     fileName: string,
//   ) => Effect.Effect<
//     { presignedUrl: string },
//     | S3Error
//     | DBError
//     | DBNotFoundError
//     | VideoUploadError
//     | InvalidMediaFileNameError,
//     never
//   >;

//   uploadedVideo: (
//     channelId: string,
//     videoId: string,
//   ) => Effect.Effect<
//     void,
//     S3Error | DBError | DBNotFoundError | VideoUploadError | QueueError,
//     never
//   >;

// publishVideo: (
//   channelId: string,
//   videoId: string,
//   data: {
//     title: string;
//     description: string | undefined;
//     visibility: VideoVisibility;
//   },
// ) => Effect.Effect<void, S3Error | DBError | DBNotFoundError, never>;

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

// addAsset: (params: {
//   userId: string;
//   channelId: string;
//   videoId: string;
//   data: AssetInsert;
// }) => Effect.Effect<
//   {
//     assetId: string;
//     presignedUrl: string;
//   },
//   DBNotFoundError | InvalidMediaTypeError | EffectDrizzleQueryError
// >;

// updateAsset: (params: {
//   assetId: string;
//   userId: string;
//   channelId: string;
//   videoId: string;
//   status: AssetStatus;
// }) => Effect.Effect<
//   void,
//   DBNotFoundError | EffectDrizzleQueryError | QueueError
// >;

// addAsset: ({ userId, channelId, videoId, data }) =>
//   Effect.gen(function* () {
//     const bucket = assetTypeToBucket(data.type);
//     if (!bucket) {
//       return yield* new InvalidMediaTypeError({
//         message: "Invalid media type",
//       });
//     }

//     if (data.type === assetType.VIDEO) {
//       const existing = yield* assetRepo.getVideoAssetByVideoId({
//         videoId: videoId,
//       });
//       if (existing && existing.status === assetStatus.UPLOADED) {
//         return yield* new InvalidMediaTypeError({
//           message: "Video already exists",
//         });
//       }
//     }
//     const created = yield* assetRepo.create({
//       userId,
//       channelId,
//       videoId,
//       data,
//     });
//     const presignedUrl = yield* s3.getPresignedUrl(created.key, bucket);
//     return {
//       assetId: created.id,
//       presignedUrl,
//     };
//   }),

// updateAsset: ({ userId, channelId, videoId, assetId, status }) =>
//   Effect.gen(function* () {
//     const updatedAsset = yield* assetRepo.update({
//       userId,
//       channelId,
//       videoId,
//       assetId,
//       status,
//     });
//     if (
//       updatedAsset.type === assetType.VIDEO &&
//       updatedAsset.status === assetStatus.UPLOADED
//     ) {
//       const message: VideoProcessingJob = {
//         rowId: videoId,
//         videoKey: updatedAsset.key,
//       };
//       yield* sns.send("videoProcessingTopicArn", message);
//     }

//     if (
//       updatedAsset.type === assetType.VIDEO_THUMBNAIL &&
//       updatedAsset.status === assetStatus.UPLOADED
//     ) {
//       const message: ImageProcessingJob = {
//         key: updatedAsset.key,
//       };
//       yield* sns.send("imageProcessingTopicArn", message);
//     }
//     return;
//   }),
