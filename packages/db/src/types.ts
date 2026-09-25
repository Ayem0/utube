import { schema } from "./schema/schema";

export type Video = typeof schema.video.$inferSelect;
export type VideoInsert = typeof schema.video.$inferInsert;

export type Channel = typeof schema.channel.$inferSelect;
export type ChannelInsert = typeof schema.channel.$inferInsert;

export type Asset = typeof schema.asset.$inferSelect;
export type AssetInsert = typeof schema.asset.$inferInsert;

export type VideoPlayback = typeof schema.videoPlayback.$inferSelect;
export type VideoPlaybackInsert = typeof schema.videoPlayback.$inferInsert;
