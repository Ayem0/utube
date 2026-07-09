import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Context, Effect, Layer } from "effect";
import { S3Error } from "./s3-errors";

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface S3Api {
  getFile: (
    key: string,
    bucket: string,
  ) => Effect.Effect<Uint8Array, S3Error, never>;
  uploadFile: (
    key: string,
    file: Uint8Array,
    bucket: string,
  ) => Effect.Effect<void, S3Error, never>;
  uploadFiles: (
    entries: { key: string; file: Uint8Array }[],
    bucket: string,
  ) => Effect.Effect<void, S3Error, never>;
  deleteFile: (
    key: string,
    bucket: string,
  ) => Effect.Effect<void, S3Error, never>;
  getPresignedUrl: (params: {
    path: string;
    bucket: string;
    mimeType: string;
    expiresIn?: number;
  }) => Effect.Effect<string, S3Error, never>;
}

export class S3 extends Context.Service<S3, S3Api>()("S3") {
  static Layer = Layer.succeed(this, {
    getFile: (path, bucket) =>
      Effect.gen(function* () {
        return yield* Effect.tryPromise({
          try: async () => {
            const res = await s3Client.send(
              new GetObjectCommand({
                Bucket: bucket,
                Key: path,
              }),
            );
            if (!res.Body) {
              throw new Error("File not found");
            }
            const file = await res.Body.transformToByteArray();
            return file;
          },
          catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
        });
      }),
    uploadFile: (path, file, bucket) =>
      Effect.tryPromise({
        try: async () =>
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: path,
              Body: file,
            }),
          ),
        catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
      }),
    uploadFiles: (entries, bucket) =>
      Effect.forEach(
        entries,
        ({ file, key }) =>
          Effect.tryPromise({
            try: async () => {
              await s3Client.send(
                new PutObjectCommand({
                  Bucket: bucket,
                  Key: key,
                  Body: file,
                }),
              );
            },
            catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
          }),
        { concurrency: "unbounded" },
      ),
    deleteFile: (path, bucket) =>
      Effect.tryPromise({
        try: async () => {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: path,
            }),
          );
        },
        catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
      }),
    getPresignedUrl: ({ path, bucket, expiresIn, mimeType }) =>
      Effect.tryPromise({
        try: async () => {
          const command = new PutObjectCommand({
            Bucket: bucket,
            Key: path,
            ContentType: mimeType,
          });

          const presignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: expiresIn ?? 60,
          });

          return presignedUrl;
        },
        catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
      }),
  });
}
