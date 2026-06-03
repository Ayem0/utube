import {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  SQSClient,
  type DeleteMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import { Context, Effect, Layer } from "effect";
import { QueueError } from "./queue-errors";

export interface SqsService {
  subscribe: <E, R>(
    queueUrl: string,
    handler: (message: string) => Effect.Effect<void, E, R>,
  ) => Effect.Effect<void, QueueError, R>;
}
const sqs = new SQSClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
export class SqsClient extends Context.Tag("SqsClient")<
  SqsClient,
  SqsService
>() {}

export const SqsClientLive = Layer.succeed(SqsClient, {
  subscribe: (queueUrl, handler) =>
    Effect.gen(function* () {
      while (true) {
        const messages = yield* Effect.tryPromise({
          try: async () => {
            const res = await sqs.send(
              new ReceiveMessageCommand({
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20,
              }),
            );

            return res.Messages;
          },
          catch: (e) =>
            new QueueError({
              cause: e,
              message: "QueueError receiving messages",
            }),
        });

        if (!messages) continue;

        const sucessEntries: DeleteMessageBatchRequestEntry[] = [];

        for (const message of messages) {
          if (!message.MessageId || !message.Body || !message.ReceiptHandle)
            continue;
          const result = yield* Effect.either(handler(message.Body));
          if (result._tag === "Right") {
            sucessEntries.push({
              Id: message.MessageId,
              ReceiptHandle: message.ReceiptHandle,
            });
          } else {
            console.log("Error consuming the message", result.left);
          }
        }

        if (sucessEntries.length > 0) {
          yield* Effect.tryPromise({
            try: async () =>
              await sqs.send(
                new DeleteMessageBatchCommand({
                  QueueUrl: queueUrl,
                  Entries: sucessEntries,
                }),
              ),
            catch: (e) =>
              new QueueError({
                cause: e,
                message: "QueueError deleting messages",
              }),
          });
        }
      }
    }),
});
