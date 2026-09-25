import { defineRelations } from "drizzle-orm";
import { schema } from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  video: {
    channel: r.one.channel({
      from: r.video.channelId,
      to: r.channel.id,
    }),
    playback: r.one.videoPlayback({
      from: r.video.currentPlaybackId,
      to: r.videoPlayback.videoId,
    }),
    currentThumbnailAsset: r.one.asset({
      from: r.video.currentThumbnailAssetId,
      to: r.asset.id,
    }),
    pendingThumbnailAsset: r.one.asset({
      from: r.video.pendingThumbnailAssetId,
      to: r.asset.id,
    }),
  },
  asset: {},
  channel: {
    video: r.many.video({
      from: r.channel.id,
      to: r.video.channelId,
    }),
    user: r.one.user({
      from: r.channel.userId,
      to: r.user.id,
    }),
  },
}));
