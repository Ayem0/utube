import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { Context, Effect, Layer } from "effect";
import { QueueError } from "./queue-errors";

export interface SnsService {
  send: (
    topic: string,
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
export class SnsClient extends Context.Tag("SNSClient")<
  SnsClient,
  SnsService
>() {}

export const SnsClientLive = Layer.succeed(SnsClient, {
  send: (topic, message) =>
    Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: async () => {
          const command = new PublishCommand({
            TopicArn: topic,
            Message: JSON.stringify(message),
          });
          await client.send(command);
        },
        catch: (e) => new QueueError({ cause: e, message: "QueueError" }),
      });
    }),
});
