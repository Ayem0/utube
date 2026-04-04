import { redisClient } from "@repo/redis";
import { RedisClient } from "bun";
import { Context, Effect, Layer } from "effect";
import { PubSubError } from "./pubsub-errors";

export interface PubSubClientService {
  publish: (
    topic: string,
    message: string,
  ) => Effect.Effect<number, PubSubError>;
  subscribe: (
    topic: string,
    listener: RedisClient.StringPubSubListener,
  ) => Effect.Effect<number, PubSubError>;
}

export class PubSubClient extends Context.Tag("PubSubClient")<
  PubSubClient,
  PubSubClientService
>() {}

export const PubSubClientLive = Layer.effect(
  PubSubClient,
  Effect.gen(function* () {
    return {
      publish: (topic, message) =>
        Effect.tryPromise({
          try: async () => await redisClient.publish(topic, message),
          catch: (e) => new PubSubError({ cause: e }),
        }),
      subscribe: (topic, listener) =>
        Effect.tryPromise({
          try: async () => await redisClient.subscribe(topic, listener),
          catch: (e) => new PubSubError({ cause: e }),
        }),
    };
  }),
);
