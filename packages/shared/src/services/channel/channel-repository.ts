import { and, asc, eq, ne } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { channel } from "../../db/schema";
import { Channel } from "../../lib/types/channel";
import { UndefinedError } from "../../lib/utils/undefined-error";
import { DBClient } from "../db/db-client";
import { DBError } from "../db/db-errors";

export interface ChannelRepositoryService {
  getChannelsByUserId(
    userId: string,
    selectedChannelId?: string,
  ): Effect.Effect<Channel[], DBError | UndefinedError>;
  getStudioChannelById(
    channelId: string,
    userId: string,
  ): Effect.Effect<Channel, DBError | UndefinedError>;
}
export class ChannelRepository extends Context.Tag("ChannelRepository")<
  ChannelRepository,
  ChannelRepositoryService
>() {}

export const ChannelRepositoryLive = Layer.effect(
  ChannelRepository,
  Effect.gen(function* () {
    const db = yield* DBClient;
    return {
      getChannelsByUserId: (userId: string, selectedChannelId?: string) =>
        Effect.gen(function* () {
          let defaultChannel: Channel | undefined = undefined;
          if (selectedChannelId) {
            // find selected channel
            defaultChannel = yield* db.run((db) =>
              db.query.channel.findFirst({
                where: and(
                  eq(channel.userId, userId),
                  eq(channel.default, true),
                ),
              }),
            );
          }
          if (!defaultChannel) {
            // if selected channel not found, find default channel
            defaultChannel = yield* db.run((db) =>
              db.query.channel.findFirst({
                where: and(
                  eq(channel.userId, userId),
                  eq(channel.default, true),
                ),
              }),
            );
          }
          if (!defaultChannel) {
            return yield* Effect.fail(
              new UndefinedError({ message: "Default channel not found" }),
            );
          }
          // find other channels
          const otherChannels = yield* db.run((db) =>
            db.query.channel.findMany({
              where: and(
                eq(channel.userId, userId),
                ne(channel.id, defaultChannel.id),
              ),
              orderBy: [asc(channel.createdAt)],
              limit: 2,
            }),
          );
          return [defaultChannel, ...otherChannels];
        }),
      getStudioChannelById: (channelId, userId) =>
        Effect.gen(function* () {
          const res = yield* db.run((db) =>
            db.query.channel.findFirst({
              where: and(eq(channel.id, channelId), eq(channel.userId, userId)),
            }),
          );
          if (!res) {
            return yield* Effect.fail(
              new UndefinedError({ message: "Channel not found" }),
            );
          }
          return res;
        }),
    };
  }),
);
