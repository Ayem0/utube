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
    asset: r.many.asset({
      from: r.video.id,
      to: r.asset.videoId,
    }),
  },
  asset: {
    video: r.one.video({
      from: r.asset.videoId,
      to: r.video.id,
    }),
  },
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

// export const userRelations = relations(user, ({ many }) => ({
//   sessions: many(session),
//   accounts: many(account),
// }));

// export const sessionRelations = relations(session, ({ one }) => ({
//   user: one(user, {
//     fields: [session.userId],
//     references: [user.id],
//   }),
// }));

// export const accountRelations = relations(account, ({ one }) => ({
//   user: one(user, {
//     fields: [account.userId],
//     references: [user.id],
//   }),
// }));

// export const videoRelations = defineRelations(video, ({ one, many }) => ({
//   channel: one(channel, {
//     fields: [video.channelId],
//     references: [channel.id],
//   }),
//   assets: many(asset),
// }));

// export const assetRelations = relations(asset, ({ one }) => ({
//   video: one(video, {
//     fields: [asset.videoId],
//     references: [video.id],
//   }),
// }));

// export const channelRelations = relations(channel, ({ one, many }) => ({
//   user: one(user, {
//     fields: [channel.userId],
//     references: [user.id],
//   }),
//   videos: many(video),
// }));
