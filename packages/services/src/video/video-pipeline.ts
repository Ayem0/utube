// import { videoPlaybackStatus } from "@repo/types/enums/video/video-playback-status";
// import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
// import { Context, Effect, Layer } from "effect";
// import { AssetRepository } from "../asset/asset-repository";
// import { DB } from "../db/db";
// import { DBNotFoundError } from "../db/db-errors";
// import { FileSystem } from "../file-system/file-system";
// import { FSError } from "../file-system/file-system-errors";
// import { S3 } from "../s3/s3";
// import { S3Error } from "../s3/s3-errors";
// import { newId } from "../utils/id";
// import { WS } from "../ws/ws";
// import {
//   VideoProcessingError,
//   VideoUploadError,
//   VideoValidationError,
//   type VideoStoryboardError,
// } from "./video-errors";
// import { VideoPlaybackRepository } from "./video-playback-repository";
// import { VideoProcessor } from "./video-processor";
// import { VideoRepository } from "./video-repository";
// import { VideoStoryboardGenerator } from "./video-storyboard-generator";
// import { VideoValidator } from "./video-validator";

// export interface VideoPipelineApi {
//   processVideo(data: {
//     assetId: string;
//   }): Effect.Effect<
//     void,
//     | DBNotFoundError
//     | S3Error
//     | FSError
//     | VideoValidationError
//     | VideoProcessingError
//     | VideoUploadError
//     | EffectDrizzleQueryError
//     | VideoStoryboardError
//   >;
// }

// export class VideoPipeline extends Context.Service<
//   VideoPipeline,
//   VideoPipelineApi
// >()("VideoPipeline", {
//   make: Effect.gen(function* () {
//     const videoRepo = yield* VideoRepository;
//     const fs = yield* FileSystem;
//     const s3 = yield* S3;
//     const videoValidator = yield* VideoValidator;
//     const storyboardGenerator = yield* VideoStoryboardGenerator;
//     const assetRepo = yield* AssetRepository;
//     const videoProcessor = yield* VideoProcessor;
//     const videoPlaybackRepo = yield* VideoPlaybackRepository;
//     const db = yield* DB;
//     const ws = yield* WS;

//     const withTempDirAndVideoFile = ({
//       dirPath,
//       filePath,
//       buffer,
//     }: {
//       dirPath: string;
//       filePath: string;
//       buffer: Uint8Array;
//     }) =>
//       Effect.acquireRelease(
//         Effect.gen(function* () {
//           console.log("AQUIRE");
//           yield* fs.createDirectory(dirPath);
//           yield* fs.writeFile(filePath, buffer);
//           return { dirPath, filePath };
//         }),
//         ({ dirPath, filePath }) =>
//           Effect.gen(function* () {
//             console.log("RELEASE");
//             yield* fs.deleteDirectory(dirPath);
//           }).pipe(Effect.catch(() => Effect.void)),
//       );

//     return {
//       processVideo: (data) =>
//         Effect.gen(function* () {
//           console.log(data);
//           const asset = yield* assetRepo.claimForProcessing({
//             assetId: data.assetId,
//           });
//           const video = yield* videoRepo.getBySourceVideoAssetId({
//             sourceVideoAssetId: asset.id,
//           });
//           const videoPlayback = yield* videoPlaybackRepo.create({
//             videoId: video.id,
//             id: newId(),
//           });

//           const attemptProcess = Effect.gen(function* () {
//             // Fetch video from s3
//             const videoFile = yield* s3.getFile(
//               asset.originalStorageKey,
//               "assets",
//             );

//             yield* Effect.scoped(
//               withTempDirAndVideoFile({
//                 dirPath: `/tmp/${video.id}`,
//                 filePath: `/tmp/${video.id}/original`,
//                 buffer: videoFile,
//               }).pipe(
//                 Effect.flatMap(({ filePath, dirPath }) =>
//                   Effect.gen(function* () {
//                     // Validate video
//                     const { videoMetadata, parsedFPS, duration } =
//                       yield* videoValidator.validateVideo(filePath);

//                     // Transcode video
//                     // TODO make this function return already relative paths by hls/dash/cmaf
//                     const { ladder, paths: transcodePaths } =
//                       yield* videoProcessor.transcode({
//                         originalPath: filePath,
//                         duration: duration,
//                         parsedFPS: parsedFPS,
//                         videoMetadata: videoMetadata,
//                         outputDir: dirPath,
//                       });

//                     const transcodeEntries: {
//                       file: Uint8Array;
//                       key: string;
//                     }[] = [];

//                     for (const path of transcodePaths) {
//                       const buffer = yield* Effect.tryPromise({
//                         try: async () => await Bun.file(path).bytes(),
//                         catch: (e) => {
//                           console.log("Error reading file bytes");
//                           return new VideoProcessingError({
//                             message: "Error reading file bytes",
//                             cause: e,
//                           });
//                         },
//                       });
//                       let key = path.replace(`${dirPath}/`, "");
//                       if (key.endsWith(".m3u8")) {
//                         key = key.replace("dash", "hls");
//                       }
//                       transcodeEntries.push({
//                         file: buffer,
//                         key: `${video.id}/${videoPlayback.id}/${key}`,
//                       });
//                     }

//                     console.log("transcodePaths", transcodePaths);

//                     // Generate storyboard
//                     const storyboardPaths = yield* storyboardGenerator.generate(
//                       {
//                         originalPath: filePath,
//                         outputDir: `${dirPath}/storyboard`,
//                         duration: duration,
//                       },
//                     );

//                     const storyboardEntries: {
//                       file: ReadableStream<Uint8Array>;
//                       key: string;
//                     }[] = [];

//                     for (const path of storyboardPaths) {
//                       const buffer = yield* Effect.try({
//                         try: () => Bun.file(path).stream(),
//                         catch: (e) => {
//                           console.log("Error reading file bytes");
//                           return new VideoProcessingError({
//                             message: "Error reading file bytes",
//                             cause: e,
//                           });
//                         },
//                       });
//                       const key = path.replace(`${dirPath}/`, "");
//                       storyboardEntries.push({
//                         file: buffer,
//                         key: `${video.id}/${videoPlayback.id}/${key}`,
//                       });
//                     }

//                     yield* s3.uploadFiles(
//                       [...storyboardEntries, ...transcodeEntries],
//                       "videos",
//                     );

//                     yield* Effect.gen(function* () {
//                       yield* videoPlaybackRepo.update({
//                         id: videoPlayback.id,
//                         values: {
//                           status: videoPlaybackStatus.READY,
//                           hlsMasterKey: `${video.id}/${videoPlayback.id}/hls/master.m3u8`,
//                           dashManifestKey: `${video.id}/${videoPlayback.id}/dash/manifest.mpd`,
//                           storyboardKey: `${video.id}/${videoPlayback.id}/storyboard/storyboard.vtt`,
//                           renditions: ladder.map((entry) => ({
//                             width: entry.width,
//                             height: entry.height,
//                             bitrate: 0, // TODO
//                             codec: "TODO",
//                             framerate: entry.fps,
//                             quality: entry.label,
//                             path: "TODO",
//                             durationMs: duration * 1000,
//                             mimeType: "TODO",
//                             qualityLabel: entry.label,
//                           })),
//                         },
//                       });
//                       yield* videoRepo.updateInternal({
//                         videoId: video.id,
//                         values: {
//                           currentPlaybackId: videoPlayback.id,
//                           duration: duration,
//                         },
//                       });
//                     }).pipe(db.withTransaction);

//                     yield* ws.send(asset.ownerUserId, {
//                       type: "video.upload.updated",
//                       videoId: video.id,
//                       channelId: video.channelId,
//                     });

//                     console.log("Video processed successfully");
//                   }),
//                 ),
//               ),
//             );
//           });

//           yield* attemptProcess.pipe(
//             Effect.catch((error) =>
//               Effect.gen(function* () {
//                 console.log("TAPERROR, attempt failed with error", error);
//                 yield* videoPlaybackRepo.update({
//                   id: videoPlayback.id,
//                   values: {
//                     status: videoPlaybackStatus.FAILED,
//                   },
//                 });
//                 return error;
//               }),
//             ),
//           );
//           console.log("PROCESSED VIDEO", video.id);
//         }),
//     };
//   }),
// }) {
//   static Layer = Layer.effect(this, this.make).pipe(
//     Layer.provide(VideoProcessor.Layer),
//     Layer.provide(FileSystem.Layer),
//     Layer.provide(VideoRepository.Layer),
//     Layer.provide(VideoStoryboardGenerator.Layer),
//     Layer.provide(VideoValidator.Layer),
//     Layer.provide(VideoPlaybackRepository.Layer),
//     Layer.provide(AssetRepository.Layer),
//     Layer.provide(DB.Layer),
//   );
// }
import { videoPlaybackStatus } from "@repo/types/enums/video/video-playback-status";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import {
  Context,
  Data,
  Effect,
  Array as EffectArray,
  Fiber,
  Layer,
  Queue,
  Ref,
  Schedule,
  Stream,
  type Cause,
} from "effect";
import { FileSystem } from "effect/FileSystem";
import type { PlatformError } from "effect/PlatformError";
import type { ChildProcessSpawner } from "effect/process/ChildProcessSpawner";
import type { Scope } from "effect/Scope";
import type { SqlError } from "effect/sql/SqlError";
import { AssetRepository } from "../asset/asset-repository";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";
import { FSError } from "../file-system/file-system-errors";
import { S3 } from "../s3/s3";
import { S3Error } from "../s3/s3-errors";
import { newId } from "../utils/id";
import { WS } from "../ws/ws";
import {
  VideoProcessingError,
  VideoUploadError,
  VideoValidationError,
  type VideoStoryboardError,
} from "./video-errors";
import { VideoPlaybackRepository } from "./video-playback-repository";
import { VideoProcessor } from "./video-processor";
import { VideoRepository } from "./video-repository";
import { VideoStoryboardGenerator } from "./video-storyboard-generator";
import { VideoValidator } from "./video-validator";

export interface VideoPipelineApi {
  processVideo(data: {
    assetId: string;
  }): Effect.Effect<
    void,
    | DBNotFoundError
    | S3Error
    | FSError
    | VideoValidationError
    | VideoProcessingError
    | PlatformError
    | VideoUploadError
    | EffectDrizzleQueryError
    | VideoStoryboardError
    | SqlError,
    ChildProcessSpawner | Scope
  >;
}

export class StreamError extends Data.TaggedError("StreamError")<{
  cause: unknown;
  message: string;
}> {}

const INIT_PATTERN = /^cmaf\/\d+\/init.m4s$/;
const MEDIA_PATTERN = /^dash\/media_\d+\.m3u8$/; // ffmpeg stores media files using the provided manifest dir which is baseDir/dash

const MASTER_PATTERN = /^hls\/master.m3u8$/;
const MANIFEST_PATTERN = /^dash\/manifest.mpd$/;
const STORYBOARD_PATTERN = /^storyboard\/.+$/;
const FINAL_CHUNK_PATTERN = /^cmaf\/\d+\/chunk_\d+\.m4s$/;

export class VideoPipeline extends Context.Service<
  VideoPipeline,
  VideoPipelineApi
>()("VideoPipeline", {
  make: Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const fs = yield* FileSystem;
    const s3 = yield* S3;
    const videoValidator = yield* VideoValidator;
    const storyboardGenerator = yield* VideoStoryboardGenerator;
    const assetRepo = yield* AssetRepository;
    const videoProcessor = yield* VideoProcessor;
    const videoPlaybackRepo = yield* VideoPlaybackRepository;
    const db = yield* DB;
    const ws = yield* WS;

    const notifyWs = ({
      channelId,
      userId,
      videoId,
    }: {
      channelId: string;
      videoId: string;
      userId: string;
    }) => ws.send(userId, { type: "video.upload.updated", channelId, videoId });

    return {
      processVideo: (data) =>
        Effect.gen(function* () {
          console.log(data);
          const asset = yield* assetRepo.claimForProcessing({
            assetId: data.assetId,
          });

          const video = yield* videoRepo.getBySourceVideoAssetId({
            sourceVideoAssetId: asset.id,
          });

          const videoPlayback = yield* videoPlaybackRepo.create({
            videoId: video.id,
            id: newId(),
          });

          const tempdir = yield* fs.makeTempDirectoryScoped({
            prefix: `video_${video.id}_${videoPlayback.id}`,
          });

          const assetGetUrl = yield* s3.getPresignedUrl({
            bucket: "uploads",
            method: "GET",
            mimeType: asset.mimeType,
            path: asset.originalStorageKey,
            expiresInSeconds: 86400,
          });

          const { videoMetadata, parsedFPS, duration } =
            yield* videoValidator.validateVideo(assetGetUrl);

          yield* videoPlaybackRepo.update({
            id: videoPlayback.id,
            values: { status: videoPlaybackStatus.VALIDATED },
          });

          yield* notifyWs({
            userId: asset.ownerUserId,
            videoId: video.id,
            channelId: video.channelId,
          });

          const queue = yield* Queue.unbounded<string, Cause.Done>();
          const storagePrefix = `${video.id}/${videoPlayback.id}`;

          const uploadAndDelete = (relativePath: string) =>
            Effect.gen(function* () {
              const absolutePath = `${tempdir}/${relativePath}`;

              yield* Effect.gen(function* () {
                const { size } = yield* fs.stat(absolutePath);
                const stream = fs.stream(absolutePath).pipe(
                  Stream.mapError(
                    (e) =>
                      new StreamError({
                        cause: e,
                        message: `Failed to read ${absolutePath}`,
                      }),
                  ),
                );

                const path = MEDIA_PATTERN.test(relativePath)
                  ? `${storagePrefix}/${relativePath.replace("dash", "hls")}`
                  : `${storagePrefix}/${relativePath}`;

                yield* s3.uploadFile(path, stream, "videos", size);
              }).pipe(
                Effect.retry({
                  times: 3,
                  schedule: Schedule.exponential("200 millis"),
                }),
              );

              yield* fs
                .remove(absolutePath)
                .pipe(Effect.catch((e) => Effect.void));
            });

          const failedUploads = yield* Ref.make(
            EffectArray.empty<{
              absolutePath: string;
              cause: S3Error | StreamError | PlatformError;
            }>(),
          );

          const consumer = Effect.gen(function* () {
            while (true) {
              const relativePath = yield* Queue.take(queue);
              yield* uploadAndDelete(relativePath).pipe(
                Effect.catch((e) =>
                  Effect.gen(function* () {
                    yield* Ref.update(failedUploads, (arr) =>
                      EffectArray.append(arr, {
                        absolutePath: `${tempdir}/${relativePath}`,
                        cause: e,
                      }),
                    );
                  }),
                ),
              );
            }
          }).pipe(Effect.catch((e) => Effect.void));

          const scheduled = new Set<string>();

          const enqueueChunk = (path: string) =>
            Effect.uninterruptible(
              Effect.suspend(() => {
                if (FINAL_CHUNK_PATTERN.test(path) && !scheduled.has(path)) {
                  scheduled.add(path);
                  return Queue.offer(queue, path);
                }
                return Effect.void;
              }),
            );

          // Start consumers
          const consumersFiber = yield* Effect.forEach(
            Array.from({ length: 3 }),
            () => consumer,
            { concurrency: 3, discard: true },
          ).pipe(Effect.forkScoped);

          // starts watching the tempDir and enqueue the chunks to upload
          const watcher = yield* Stream.runForEach(
            fs.watch(tempdir, { recursive: true }),
            (event) =>
              Effect.gen(function* () {
                if (event._tag === "Create") {
                  yield* enqueueChunk(event.path);
                }
              }),
          ).pipe(Effect.forkScoped);

          const ladder = yield* videoProcessor.transcode({
            originalPath: assetGetUrl,
            parsedFPS: parsedFPS,
            videoMetadata: videoMetadata,
            outputDir: tempdir,
          });
          // stops watching
          yield* Fiber.interrupt(watcher);

          // Watch can miss events
          // reads all the chunks in the cmaf directory and enqueues them to upload
          const cmafDir = `${tempdir}/cmaf`;
          const cmafPaths = yield* fs.readDirectory(cmafDir, {
            recursive: true,
          });
          yield* Effect.forEach(cmafPaths, (cmafPath) =>
            enqueueChunk(`cmaf/${cmafPath}`),
          );

          const storyboardDir = `${tempdir}/storyboard`;
          yield* fs.makeDirectory(storyboardDir);
          yield* storyboardGenerator.generate({
            originalPath: assetGetUrl,
            outputDir: storyboardDir,
            duration: duration,
          });

          // Read all the remaining media, init, master, manifest, storyboard files
          const paths = yield* fs.readDirectory(tempdir, { recursive: true });
          yield* Effect.forEach(
            paths,
            (path) =>
              Effect.gen(function* () {
                if (
                  INIT_PATTERN.test(path) ||
                  MEDIA_PATTERN.test(path) ||
                  MASTER_PATTERN.test(path) ||
                  MANIFEST_PATTERN.test(path) ||
                  STORYBOARD_PATTERN.test(path)
                ) {
                  yield* Queue.offer(queue, path);
                } else {
                  yield* Effect.logError(
                    `Unrecognized file ${path} should not be present`,
                  );
                }
              }),
            { concurrency: 3, discard: true },
          );

          // signals that no more elements will be added to the queue
          yield* Queue.end(queue);
          // waits for all the consumers to finish consuming
          yield* Fiber.join(consumersFiber);

          // see all the failures
          // TODO see how to manage failures, maybe return something instead of void
          yield* Effect.forEach(yield* Ref.get(failedUploads), (fail) =>
            Effect.gen(function* () {
              if (fail.cause._tag === "StreamError") {
                const exists = yield* fs.exists(fail.absolutePath);
                if (!exists) return;
              } else if (fail.cause._tag === "S3Error") {
              }
            }),
          );

          yield* Effect.gen(function* () {
            yield* videoPlaybackRepo.update({
              id: videoPlayback.id,
              values: {
                status: videoPlaybackStatus.READY,
                hlsMasterKey: `${storagePrefix}/hls/master.m3u8`,
                dashManifestKey: `${storagePrefix}/dash/manifest.mpd`,
                storyboardKey: `${storagePrefix}/storyboard/storyboard.vtt`,
                renditions: ladder.map((entry) => ({
                  width: entry.width,
                  height: entry.height,
                  bitrate: 0, // TODO
                  codec: "TODO",
                  framerate: entry.fps,
                  quality: entry.label,
                  path: "TODO",
                  durationMs: duration * 1000,
                  mimeType: "TODO",
                  qualityLabel: entry.label,
                })),
              },
            });
            yield* videoRepo.updateInternal({
              videoId: video.id,
              values: {
                currentPlaybackId: videoPlayback.id,
                duration: duration,
              },
            });
          }).pipe(db.withTransaction);

          yield* notifyWs({
            userId: asset.ownerUserId,
            videoId: video.id,
            channelId: video.channelId,
          });
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(VideoProcessor.Layer),
    Layer.provide(VideoRepository.Layer),
    Layer.provide(VideoStoryboardGenerator.Layer),
    Layer.provide(VideoValidator.Layer),
    Layer.provide(VideoPlaybackRepository.Layer),
    Layer.provide(AssetRepository.Layer),
    Layer.provide(DB.Layer),
  );
}
