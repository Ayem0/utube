import type { Asset } from "@repo/db/types";
import { AssetType, assetType } from "@repo/types/enums/asset/asset-type";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import { ChannelAvatarAssetHandler } from "../channel/channel-avatar-asset-handler";
import type { DBNotFoundError } from "../db/db-errors";
import type { QueueError } from "../queue/queue-errors";
import { VideoSourceAssetHandler } from "../video/video-source-asset-handler";
import { VideoThumbnailAssetHandler } from "../video/video-thumbnail-asset-handler";

export interface AssetHandlerApi {
  handle: (
    asset: Asset,
  ) => Effect.Effect<
    void,
    DBNotFoundError | EffectDrizzleQueryError | QueueError
  >;
}

export interface AssetProcessingDispatcherApi {
  dispatch: (
    asset: Asset,
  ) => Effect.Effect<
    void,
    DBNotFoundError | EffectDrizzleQueryError | QueueError
  >;
}

export class AssetProcessingDispatcher extends Context.Service<
  AssetProcessingDispatcher,
  AssetProcessingDispatcherApi
>()("AssetProcessingDispatcher", {
  make: Effect.gen(function* () {
    const videoSourceAssetHandler = yield* VideoSourceAssetHandler;
    const videoThumbnailAssetHandler = yield* VideoThumbnailAssetHandler;
    const channelAvatarAssetHandler = yield* ChannelAvatarAssetHandler;

    const handlers = new Map<AssetType, AssetHandlerApi>([
      [assetType.VIDEO, videoSourceAssetHandler],
      [assetType.VIDEO_THUMBNAIL, videoThumbnailAssetHandler],
      [assetType.CHANNEL_AVATAR, channelAvatarAssetHandler],
    ]);

    return {
      dispatch: (asset) =>
        Effect.gen(function* () {
          const handler = handlers.get(asset.type);
          if (!handler) {
            console.log("No handler found for asset type", asset.type);
            return;
          }
          yield* handler.handle(asset);
        }),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(VideoSourceAssetHandler.Layer),
    Layer.provide(VideoThumbnailAssetHandler.Layer),
    Layer.provide(ChannelAvatarAssetHandler.Layer),
  );
}
