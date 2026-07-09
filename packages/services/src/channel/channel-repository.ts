import { channel } from "@repo/db/schema";
import { Channel } from "@repo/db/types";
import { and, asc, eq, or, sql } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";

type ChannelLight = Pick<
  Channel,
  "id" | "name" | "alias" | "currentAvatarAssetId" | "default"
>;

const channelLightSelect = {
  id: channel.id,
  name: channel.name,
  alias: channel.alias,
  currentAvatarAssetId: channel.currentAvatarAssetId,
  default: channel.default,
} as const;

export interface ChannelRepositoryService {
  getChannelsByUserId(params: {
    userId: string;
    selectedChannelId?: string;
  }): Effect.Effect<ChannelLight[], EffectDrizzleQueryError | DBNotFoundError>;
  getStudioChannelById(params: {
    userId: string;
    channelId: string;
  }): Effect.Effect<ChannelLight, EffectDrizzleQueryError | DBNotFoundError>;

  getByPendingAvatarAssetId(
    assetId: string,
  ): Effect.Effect<Channel, EffectDrizzleQueryError | DBNotFoundError>;

  setPendingAvatarAssetId(params: {
    channelId: string;
    assetId: string | null;
  }): Effect.Effect<Channel, EffectDrizzleQueryError | DBNotFoundError>;

  updateCurrentAvatarAssetIdWithPendingAssetId(
    channelId: string,
  ): Effect.Effect<Channel, EffectDrizzleQueryError | DBNotFoundError>;
}

export class ChannelRepository extends Context.Service<
  ChannelRepository,
  ChannelRepositoryService
>()("ChannelRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;
    return {
      getChannelsByUserId: ({ userId, selectedChannelId }) =>
        Effect.gen(function* () {
          const primaryChannel = db.$with("primary_channel").as(
            db
              .select()
              .from(channel)
              .where(
                and(
                  eq(channel.userId, userId),
                  selectedChannelId
                    ? or(
                        eq(channel.id, selectedChannelId),
                        eq(channel.default, true),
                      )
                    : eq(channel.default, true),
                ),
              )
              .orderBy(
                selectedChannelId
                  ? sql`
                case
                  when ${channel.id} = ${selectedChannelId} then 0
                  when ${channel.default} = true then 1
                  else 2
                end
              `
                  : sql`
                case
                  when ${channel.default} = true then 0
                  else 1
                end
              `,
              )
              .limit(1),
          );

          const rows = yield* db
            .with(primaryChannel)
            .select(channelLightSelect)
            .from(channel)
            .innerJoin(primaryChannel, sql`true`)
            .where(eq(channel.userId, userId))
            .orderBy(
              sql`
                case
                  when ${channel.id} = ${primaryChannel.id} then 0
                  else 1
                end
              `,
              asc(channel.createdAt),
            )
            .limit(3);

          if (rows.length === 0) {
            return yield* new DBNotFoundError({
              message: "No channel found for user",
            });
          }
          return rows;
        }),

      getStudioChannelById: ({ userId, channelId }) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .select(channelLightSelect)
            .from(channel)
            .where(and(eq(channel.userId, userId), eq(channel.id, channelId)))
            .limit(1);

          if (!row) {
            return yield* new DBNotFoundError({
              message: "Channel not found",
            });
          }

          return row;
        }),

      getByPendingAvatarAssetId: (assetId) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .select()
            .from(channel)
            .where(eq(channel.pendingAvatarAssetId, assetId))
            .limit(1);

          if (!row) {
            return yield* new DBNotFoundError({
              message: "Channel not found",
            });
          }

          return row;
        }),

      setPendingAvatarAssetId: ({ channelId, assetId }) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .update(channel)
            .set({
              pendingAvatarAssetId: assetId,
            })
            .where(eq(channel.id, channelId))
            .returning();

          if (!row) {
            return yield* new DBNotFoundError({
              message: "Channel not found",
            });
          }

          return row;
        }),

      updateCurrentAvatarAssetIdWithPendingAssetId: (channelId) =>
        Effect.gen(function* () {
          const [row] = yield* db
            .update(channel)
            .set({
              currentAvatarAssetId: channel.pendingAvatarAssetId,
              pendingAvatarAssetId: null,
            })
            .where(eq(channel.id, channelId))
            .returning();

          if (!row) {
            return yield* new DBNotFoundError({
              message: "Channel not found",
            });
          }

          return row;
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(Layer.provide(DB.Layer));
}

// export const ChannelRepositoryLive = Layer.effect(
//   ChannelRepository,
//   Effect.gen(function* () {
//     const db = yield* DBClient;
//     return {
//       getChannelsByUserId: (userId: string, selectedChannelId?: string) =>
//         Effect.gen(function* () {
//           const defaultChannel = yield* db.run((db) =>
//             db.query.channel.findFirst({
//               where: and(
//                 eq(channel.userId, userId),
//                 selectedChannelId
//                   ? eq(channel.id, selectedChannelId)
//                   : eq(channel.default, true),
//               ),
//             }),
//           ) ??
//             db.run((db) =>
//               db.query.channel.findFirst({
//                 where: and(
//                   eq(channel.userId, userId),
//                   eq(channel.default, true),
//                 ),
//               }),
//             );
//           if (!defaultChannel) {
//             return yield* Effect.fail(
//               new DBNotFoundError({ message: "Default channel not found" }),
//             );
//           }
//           // find other channels
//           const otherChannels = yield* db.run((db) =>
//             db.query.channel.findMany({
//               where: and(
//                 eq(channel.userId, userId),
//                 ne(channel.id, defaultChannel.id),
//               ),
//               orderBy: [asc(channel.createdAt)],
//               limit: 2,
//             }),
//           );
//           return [defaultChannel, ...otherChannels];
//         }),
//       getStudioChannelById: (channelId, userId) =>
//         Effect.gen(function* () {
//           const res = yield* db.run((db) =>
//             db.query.channel.findFirst({
//               where: and(eq(channel.id, channelId), eq(channel.userId, userId)),
//             }),
//           );
//           if (!res) {
//             return yield* Effect.fail(
//               new DBNotFoundError({ message: "Channel not found" }),
//             );
//           }
//           return res;
//         }),
//     };
//   }),
// );
