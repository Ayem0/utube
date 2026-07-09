import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { Context, Effect, Layer } from "effect";
import { QueueError } from "./queue-errors";
import { SNSConfig, type SNSConfigService } from "./sns-config";

type TopicArns = keyof SNSConfigService;
export interface SNSService {
  send: (
    topicArn: TopicArns,
    message: unknown,
  ) => Effect.Effect<void, QueueError, never>;
}

const client = new SNSClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class SNS extends Context.Service<SNS, SNSService>()("SNS", {
  make: Effect.gen(function* () {
    const snsConfig = yield* SNSConfig;
    return {
      send: (topicArn, message) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: async () => {
              const command = new PublishCommand({
                TopicArn: snsConfig[topicArn],
                Message: JSON.stringify(message),
              });
              await client.send(command);
            },
            catch: (e) => new QueueError({ cause: e, message: "QueueError" }),
          });
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(SNSConfig.Layer),
  );
}
