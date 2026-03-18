import { channel, video } from "../../db/schema";

export type Channel = typeof channel.$inferSelect;
export type Video = typeof video.$inferSelect;
