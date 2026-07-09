import { videoPlaybackStatus } from "@repo/types/enums/video/video-status";
import { VideoProcessingJob } from "@repo/types/types/video-processing-job";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import { AssetRepository } from "../asset/asset-repository";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";
import { FileSystem } from "../file-system/file-system";
import { FSError } from "../file-system/file-system-errors";
import { S3 } from "../s3/s3";
import { S3Error } from "../s3/s3-errors";
import { newId } from "../utils/id";
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

export interface VideoPipelineService {
  processVideo(
    data: VideoProcessingJob,
  ): Effect.Effect<
    void,
    | DBNotFoundError
    | S3Error
    | FSError
    | VideoValidationError
    | VideoProcessingError
    | VideoUploadError
    | EffectDrizzleQueryError
    | VideoStoryboardError
  >;
}

export class VideoPipeline extends Context.Service<
  VideoPipeline,
  VideoPipelineService
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

    const withTempDirAndVideoFile = ({
      dirPath,
      filePath,
      buffer,
    }: {
      dirPath: string;
      filePath: string;
      buffer: Uint8Array;
    }) =>
      Effect.acquireRelease(
        Effect.gen(function* () {
          console.log("AQUIRE");
          yield* fs.createDirectory(dirPath);
          yield* fs.writeFile(filePath, buffer);
          return { dirPath, filePath };
        }),
        ({ dirPath, filePath }) =>
          Effect.gen(function* () {
            console.log("RELEASE");
            yield* fs.deleteDirectory(dirPath);
          }).pipe(Effect.catch(() => Effect.void)),
      );

    return {
      processVideo: (data) =>
        Effect.gen(function* () {
          console.log(data);
          const asset = yield* assetRepo.claimForProcessing({
            assetId: data.assetId,
          });
          const video = yield* videoRepo.getBySourceVideoAssetId(asset.id);
          const videoPlayback = yield* videoPlaybackRepo.create({
            videoId: video.id,
            id: newId(),
          });

          const attemptProcess = Effect.gen(function* () {
            // Fetch video from s3
            const videoFile = yield* s3.getFile(
              asset.originalStorageKey,
              "assets",
            );

            yield* Effect.scoped(
              withTempDirAndVideoFile({
                dirPath: `/tmp/${video.id}`,
                filePath: `/tmp/${video.id}/original`,
                buffer: videoFile,
              }).pipe(
                Effect.flatMap(({ filePath, dirPath }) =>
                  Effect.gen(function* () {
                    // Validate video
                    const { videoMetadata, parsedFPS, duration } =
                      yield* videoValidator.validateVideo(filePath);

                    // Transcode video
                    // TODO make this function return already relative paths by hls/dash/cmaf
                    const { ladder, paths: transcodePaths } =
                      yield* videoProcessor.transcode({
                        originalPath: filePath,
                        duration: duration,
                        parsedFPS: parsedFPS,
                        videoMetadata: videoMetadata,
                        outputDir: dirPath,
                      });

                    const transcodeEntries: {
                      file: Uint8Array;
                      key: string;
                    }[] = [];

                    for (const path of transcodePaths) {
                      const buffer = yield* Effect.tryPromise({
                        try: async () => await Bun.file(path).bytes(),
                        catch: (e) => {
                          console.log("Error reading file bytes");
                          return new VideoProcessingError({
                            message: "Error reading file bytes",
                            cause: e,
                          });
                        },
                      });
                      let key = path.replace(`${dirPath}/`, "");
                      if (key.endsWith(".m3u8")) {
                        key = key.replace("dash", "hls");
                      }
                      transcodeEntries.push({
                        file: buffer,
                        key: `${video.id}/${videoPlayback.id}/${key}`,
                      });
                    }

                    console.log("transcodePaths", transcodePaths);

                    // Generate storyboard
                    const storyboardPaths = yield* storyboardGenerator.generate(
                      {
                        originalPath: filePath,
                        outputDir: `${dirPath}/storyboard`,
                        duration: duration,
                      },
                    );

                    const storyboardEntries: {
                      file: Uint8Array;
                      key: string;
                    }[] = [];

                    for (const path of storyboardPaths) {
                      const buffer = yield* Effect.tryPromise({
                        try: async () => await Bun.file(path).bytes(),
                        catch: (e) => {
                          console.log("Error reading file bytes");
                          return new VideoProcessingError({
                            message: "Error reading file bytes",
                            cause: e,
                          });
                        },
                      });
                      const key = path.replace(`${dirPath}/`, "");
                      storyboardEntries.push({
                        file: buffer,
                        key: `${video.id}/${videoPlayback.id}/${key}`,
                      });
                    }

                    yield* s3.uploadFiles(
                      [...storyboardEntries, ...transcodeEntries],
                      "videos",
                    );

                    yield* db.transaction((tx) =>
                      Effect.gen(function* () {
                        yield* videoPlaybackRepo.update(
                          {
                            id: videoPlayback.id,
                            values: {
                              status: videoPlaybackStatus.READY,
                              hlsMasterKey: `${video.id}/${videoPlayback.id}/hls/master.m3u8`,
                              dashManifestKey: `${video.id}/${videoPlayback.id}/dash/manifest.mpd`,
                              storyboardKey: `${video.id}/${videoPlayback.id}/storyboard/storyboard.vtt`,
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
                          },
                          tx,
                        );
                        yield* videoRepo.updateInternal(
                          {
                            videoId: video.id,
                            data: {
                              currentPlaybackId: videoPlayback.id,
                              duration: duration,
                            },
                          },
                          tx,
                        );
                      }),
                    );

                    console.log("Video processed successfully");
                  }),
                ),
              ),
            );
          });

          yield* attemptProcess.pipe(
            // Effect.tap(
            //   Effect.gen(function* () {
            //     console.log("TAP");
            //     yield* videoPlaybackRepo.update({
            //       id: videoPlayback.id,
            //       values: {
            //         dashManifestKey: `${video.id}/${videoPlayback.id}/dash/manifest.mpd`,
            //         hlsMasterKey: `${video.id}/${videoPlayback.id}/hls/master.m3u8`,
            //         storyboardKey: `${video.id}/${videoPlayback.id}/storyboard.vtt`,
            //         status: videoPlaybackStatus.READY,
            //       },
            //     });
            //   }),
            // ),
            Effect.catch((error) =>
              Effect.gen(function* () {
                console.log("TAPERROR, attempt failed with error", error);
                yield* videoPlaybackRepo.update({
                  id: videoPlayback.id,
                  values: {
                    status: videoPlaybackStatus.FAILED,
                  },
                });
                return error;
              }),
            ),
          );
          console.log("PROCESSED VIDEO", data.videoId);
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(VideoProcessor.Layer),
    Layer.provide(FileSystem.Layer),
    Layer.provide(VideoRepository.Layer),
    Layer.provide(VideoStoryboardGenerator.Layer),
    Layer.provide(S3.Layer),
    Layer.provide(VideoValidator.Layer),
    Layer.provide(VideoPlaybackRepository.Layer),
    Layer.provide(AssetRepository.Layer),
    Layer.provide(DB.Layer),
  );
}
