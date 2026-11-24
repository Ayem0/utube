import { assetStatus } from "@repo/types/enums/asset/asset-status";
import { videoPlaybackStatus } from "@repo/types/enums/video/video-playback-status";
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
import { AssetRepository } from "../asset/asset-repository";
import { DB } from "../db/db";
import { S3 } from "../s3/s3";
import { S3Error } from "../s3/s3-errors";
import { newId } from "../utils/id";
import { WS } from "../ws/ws";
import { VideoPlaybackRepository } from "./video-playback-repository";
import { VideoProcessor } from "./video-processor";
import { VideoRepository } from "./video-repository";
import { VideoStoryboardGenerator } from "./video-storyboard-generator";
import { VideoValidator } from "./video-validator";

export class VideoPipelineError extends Data.TaggedError("VideoPipelineError")<{
  cause: unknown;
  message: string;
}> {}

export interface VideoPipelineApi {
  processVideo(data: {
    assetId: string;
  }): Effect.Effect<void, VideoPipelineError, ChildProcessSpawner | Scope>;
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

          const { asset, video, videoPlayback } = yield* Effect.gen(
            function* () {
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
              return { asset, video, videoPlayback };
            },
          ).pipe(db.withTransaction);

          yield* Effect.gen(function* () {
            const tempdir = yield* fs.makeTempDirectoryScoped({
              prefix: `video_${video.id}_${videoPlayback.id}`,
            });

            const assetGetUrl = yield* s3.getPresignedUrl({
              bucket: "uploads",
              method: "GET",
              key: asset.originalStorageKey,
              expiresInSeconds: 86400,
            });

            const validateResult =
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

                  yield* s3.uploadFile({
                    key: path,
                    file: stream,
                    bucket: "videos",
                    size: size,
                  });
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
              input: assetGetUrl,
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

            yield* storyboardGenerator.generate({
              originalPath: assetGetUrl,
              outputDir: tempdir,
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
              yield* assetRepo.unclaimFromProcessingReady({
                type: asset.type,
                assetId: asset.id,
                status: assetStatus.READY,
              });
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
          }).pipe(
            Effect.catch((c) =>
              Effect.gen(function* () {
                yield* assetRepo.unclaimFromProcessingFailed({
                  assetId: asset.id,
                  status: assetStatus.FAILED,
                });
                yield* videoPlaybackRepo.update({
                  id: videoPlayback.id,
                  values: { status: videoPlaybackStatus.FAILED },
                });
                yield* notifyWs({
                  userId: asset.ownerUserId,
                  videoId: video.id,
                  channelId: video.channelId,
                });
                return yield* new VideoPipelineError({
                  cause: c,
                  message: "Failed to process video",
                });
              }),
            ),
          );
        }).pipe(
          Effect.catch(
            (c) =>
              new VideoPipelineError({
                cause: c,
                message: "Video pipeline error",
              }),
          ),
        ),
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
