import { assetStatus } from "@repo/types/enums/asset/asset-status";
import type { VideoProcessingJob } from "@repo/types/types/video-processing-job";
import { Context, Effect, Layer } from "effect";
import type { AssetHandlerApi } from "../asset/asset-processing-dispatcher";
import { Queue } from "../queue/queue";
import { VideoRepository } from "./video-repository";

export class VideoSourceAssetHandler extends Context.Service<
  VideoSourceAssetHandler,
  AssetHandlerApi
>()("VideoSourceAssetHandler", {
  make: Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const queue = yield* Queue;
    return {
      handle: (asset) =>
        Effect.gen(function* () {
          if (asset.status === assetStatus.FAILED) {
            // TODO cleanup
            return;
          }
          if (asset.status !== assetStatus.UPLOADED) {
            console.log(`Asset is already being processed: ${asset.id}`);
            return;
          }
          const video = yield* videoRepo.getBySourceVideoAssetId({
            sourceVideoAssetId: asset.id,
          });
          const msg: VideoProcessingJob = {
            assetId: asset.id,
            videoId: video.id,
          };
          yield* queue.send(msg);
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(VideoRepository.Layer),
  );
}
