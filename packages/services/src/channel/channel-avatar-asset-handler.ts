import { assetStatus } from "@repo/types/enums/asset/asset-status";
import { assetType } from "@repo/types/enums/asset/asset-type";
import type { ImageProcessingJob } from "@repo/types/schemas/image-processing-job";
import { Context, Effect, Layer } from "effect";
import type { AssetHandlerApi } from "../asset/asset-processing-dispatcher";
import { SNS } from "../queue/sns";
import { ChannelRepository } from "./channel-repository";

export class ChannelAvatarAssetHandler extends Context.Service<
  ChannelAvatarAssetHandler,
  AssetHandlerApi
>()("ChannelAvatarAssetHandler", {
  make: Effect.gen(function* () {
    const channelRepo = yield* ChannelRepository;
    const sns = yield* SNS;
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
          const channel = yield* channelRepo.getByPendingAvatarAssetId(
            asset.id,
          );

          const msg: ImageProcessingJob = {
            assetId: asset.id,
            entityId: channel.id,
            imageAssetType: assetType.CHANNEL_AVATAR,
          };
          yield* sns.send("imageProcessingTopicArn", msg);
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ChannelRepository.Layer),
    Layer.provide(SNS.Layer),
  );
}
