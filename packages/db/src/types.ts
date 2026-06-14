import { schema } from "./schema/schema";

export type Video = typeof schema.video.$inferSelect;
export type Channel = typeof schema.channel.$inferSelect;
export type Asset = typeof schema.asset.$inferSelect;
