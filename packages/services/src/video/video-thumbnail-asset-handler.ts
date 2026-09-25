import { assetStatus } from "@repo/types/enums/asset/asset-status";
import { assetType } from "@repo/types/enums/asset/asset-type";
import type { ImageProcessingJob } from "@repo/types/schemas/image-processing-job";
import { Context, Effect, Layer } from "effect";
import type { AssetHandlerApi } from "../asset/asset-processing-dispatcher";
import { Queue } from "../queue/queue";
import { VideoRepository } from "./video-repository";

export class VideoThumbnailAssetHandler extends Context.Service<
  VideoThumbnailAssetHandler,
  AssetHandlerApi
>()("VideoThumbnailAssetHandler", {
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
          const video = yield* videoRepo.getByCurrentThumbnailAssetId({
            currentThumbnailAssetId: asset.id,
          });
          const msg: ImageProcessingJob = {
            assetId: asset.id,
            entityId: video.id,
            imageAssetType: assetType.VIDEO_THUMBNAIL,
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
