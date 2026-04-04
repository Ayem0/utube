import { channel } from "@repo/db/schema";
import { Channel } from "@repo/db/types";
import { and, asc, eq, ne } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DBClient } from "../db/db-client";
import { DBError, DBNotFoundError } from "../db/db-errors";

export interface ChannelRepositoryService {
  getChannelsByUserId(
    userId: string,
    selectedChannelId?: string,
  ): Effect.Effect<Channel[], DBError | DBNotFoundError>;
  getStudioChannelById(
    channelId: string,
    userId: string,
  ): Effect.Effect<Channel, DBError | DBNotFoundError>;
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
          const defaultChannel = yield* db.run((db) =>
            db.query.channel.findFirst({
              where: and(
                eq(channel.userId, userId),
                selectedChannelId
                  ? eq(channel.id, selectedChannelId)
                  : eq(channel.default, true),
              ),
            }),
          ) ??
            db.run((db) =>
              db.query.channel.findFirst({
                where: and(
                  eq(channel.userId, userId),
                  eq(channel.default, true),
                ),
              }),
            );
          if (!defaultChannel) {
            return yield* Effect.fail(
              new DBNotFoundError({ message: "Default channel not found" }),
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
              new DBNotFoundError({ message: "Channel not found" }),
            );
          }
          return res;
        }),
    };
  }),
);
