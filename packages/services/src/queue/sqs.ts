// import {
//   DeleteMessageBatchCommand,
//   ReceiveMessageCommand,
//   SQSClient,
//   type DeleteMessageBatchRequestEntry,
// } from "@aws-sdk/client-sqs";
// import { Context, Effect, Layer } from "effect";
// import { QueueError } from "./queue-errors";
// import { SQSConfig, type SQSConfigService } from "./sqs-config";

// type QueueUrls = keyof SQSConfigService;
// export interface SQSService {
//   subscribe: <E, R>(
//     queue: QueueUrls,
//     handler: (message: string) => Effect.Effect<void, E, R>,
//   ) => Effect.Effect<void, QueueError | E, R>;
// }
// const sqs = new SQSClient({
//   region: process.env.AWS_REGION,
//   endpoint: process.env.AWS_ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });
// export class SQS extends Context.Service<SQS, SQSService>()("SQS", {
//   make: Effect.gen(function* () {
//     const cfg = yield* SQSConfig;
//     return {
//       subscribe: (queue, handler) =>
//         Effect.gen(function* () {
//           const queueUrl = cfg[queue];
//           while (true) {
//             const messages = yield* Effect.tryPromise({
//               try: async () => {
//                 const res = await sqs.send(
//                   new ReceiveMessageCommand({
//                     QueueUrl: queueUrl,
//                     MaxNumberOfMessages: 10,
//                     WaitTimeSeconds: 20,
//                   }),
//                 );

//                 return res.Messages;
//               },
//               catch: (e) =>
//                 new QueueError({
//                   cause: e,
//                   message: "QueueError receiving messages",
//                 }),
//             });

//             if (!messages) continue;

//             const sucessEntries: DeleteMessageBatchRequestEntry[] = [];

//             for (const message of messages) {
//               if (!message.MessageId || !message.Body || !message.ReceiptHandle)
//                 continue;
//               yield* handler(message.Body).pipe(
//                 Effect.match({
//                   onFailure: (err) => {
//                     console.log("Error consuming the message", err);
//                   },
//                   onSuccess: () => {
//                     console.log("Successfully consumed the message", message);
//                     sucessEntries.push({
//                       Id: message.MessageId,
//                       ReceiptHandle: message.ReceiptHandle,
//                     });
//                   },
//                 }),
//               );
//             }

//             if (sucessEntries.length > 0) {
//               yield* Effect.tryPromise({
//                 try: async () =>
//                   await sqs.send(
//                     new DeleteMessageBatchCommand({
//                       QueueUrl: queueUrl,
//                       Entries: sucessEntries,
//                     }),
//                   ),
//                 catch: (e) =>
//                   new QueueError({
//                     cause: e,
//                     message: "QueueError deleting messages",
//                   }),
//               });
//             }
//           }
//         }),
//     };
//   }),
// }) {
//   static Layer = Layer.effect(this, this.make).pipe(
//     Layer.provide(SQSConfig.Layer),
//   );
// }
