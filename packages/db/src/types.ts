import { asset, channel, video } from "./schema";

export type Video = typeof video.$inferSelect;
export type Channel = typeof channel.$inferSelect;
export type Asset = typeof asset.$inferSelect;
