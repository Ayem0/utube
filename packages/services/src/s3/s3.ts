// import {
//   DeleteObjectCommand,
//   GetObjectCommand,
//   PutObjectCommand,
//   S3Client,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { Context, Effect, Layer, Redacted } from "effect";
// import { s3Config } from "./s3-config";
// import { S3Error } from "./s3-errors";

// export interface S3Api {
//   getFile: (key: string, bucket: string) => Effect.Effect<Uint8Array, S3Error>;
//   uploadFile: (
//     key: string,
//     file: Uint8Array,
//     bucket: string,
//   ) => Effect.Effect<void, S3Error>;
//   uploadFiles: (
//     entries: { key: string; file: Uint8Array }[],
//     bucket: string,
//   ) => Effect.Effect<void, S3Error>;
//   deleteFile: (key: string, bucket: string) => Effect.Effect<void, S3Error>;
//   getPresignedUrl: (params: {
//     path: string;
//     bucket: string;
//     mimeType: string;
//     expiresIn?: number;
//   }) => Effect.Effect<string, S3Error>;
// }

// export class S3 extends Context.Service<S3, S3Api>()("S3", {
//   make: Effect.gen(function* () {
//     const cfg = yield* s3Config;

//     const s3Client = yield* Effect.acquireRelease(
//       Effect.sync(
//         () =>
//           new S3Client({
//             endpoint: cfg.endpoint,
//             forcePathStyle: cfg.forcePathStyle,
//             credentials: {
//               accessKeyId: Redacted.value(cfg.accessKeyId),
//               secretAccessKey: Redacted.value(cfg.secretAccessKey),
//             },
//           }),
//       ),
//       (s3Client) => Effect.sync(() => s3Client.destroy()),
//     );
//     return {
//       getFile: (path, bucket) =>
//         Effect.gen(function* () {
//           return yield* Effect.tryPromise({
//             try: async () => {
//               const res = await s3Client.send(
//                 new GetObjectCommand({
//                   Bucket: bucket,
//                   Key: path,
//                 }),
//               );
//               if (!res.Body) {
//                 throw new Error("File not found");
//               }
//               const file = await res.Body.transformToByteArray();
//               return file;
//             },
//             catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
//           });
//         }),
//       uploadFile: (path, file, bucket) =>
//         Effect.tryPromise({
//           try: async () =>
//             await s3Client.send(
//               new PutObjectCommand({
//                 Bucket: bucket,
//                 Key: path,
//                 Body: file,
//               }),
//             ),
//           catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
//         }),
//       uploadFiles: (entries, bucket) =>
//         Effect.forEach(
//           entries,
//           ({ file, key }) =>
//             Effect.tryPromise({
//               try: async () => {
//                 await s3Client.send(
//                   new PutObjectCommand({
//                     Bucket: bucket,
//                     Key: key,
//                     Body: file,
//                   }),
//                 );
//               },
//               catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
//             }),
//           { concurrency: "unbounded" },
//         ),
//       deleteFile: (path, bucket) =>
//         Effect.tryPromise({
//           try: async () => {
//             await s3Client.send(
//               new DeleteObjectCommand({
//                 Bucket: bucket,
//                 Key: path,
//               }),
//             );
//           },
//           catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
//         }),
//       getPresignedUrl: ({ path, bucket, expiresIn, mimeType }) =>
//         Effect.tryPromise({
//           try: async () => {
//             const command = new PutObjectCommand({
//               Bucket: bucket,
//               Key: path,
//               ContentType: mimeType,
//             });

//             const presignedUrl = await getSignedUrl(s3Client, command, {
//               expiresIn: expiresIn ?? 60,
//             });

//             return presignedUrl;
//           },
//           catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
//         }),
//     };
//   }),
// }) {
//   static Layer = Layer.effect(this, this.make);
// }

import { Context, Effect } from "effect";
import { S3Error } from "./s3-errors";

export interface S3Api {
  getFile: (key: string, bucket: string) => Effect.Effect<Uint8Array, S3Error>;
  uploadFile: (
    key: string,
    file: Uint8Array,
    bucket: string,
  ) => Effect.Effect<void, S3Error>;
  uploadFiles: (
    entries: { key: string; file: Uint8Array }[],
    bucket: string,
  ) => Effect.Effect<void, S3Error>;
  deleteFile: (key: string, bucket: string) => Effect.Effect<void, S3Error>;
  getPresignedUrl: (params: {
    path: string;
    bucket: string;
    mimeType: string;
    expiresIn?: number;
    method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
  }) => Effect.Effect<string, S3Error>;
}

export class S3 extends Context.Service<S3, S3Api>()("S3") {}
