import { s3Client } from "@repo/s3";
import { Context, Effect, Layer } from "effect";
import { S3Error } from "./s3-errors";

export interface S3ClientService {
  getFile: (
    key: string,
    bucket: string,
  ) => Effect.Effect<Bun.S3File, S3Error, never>;
  uploadFile: (
    key: string,
    file: File | Bun.BunFile,
    bucket: string,
  ) => Effect.Effect<void, S3Error, never>;
  uploadFiles: (
    entries: { key: string; file: Bun.BunFile | File }[],
    bucket: string,
  ) => Effect.Effect<void, S3Error, never>;
  deleteFile: (
    key: string,
    bucket: string,
  ) => Effect.Effect<void, S3Error, never>;
}

export class S3Client extends Context.Tag("S3Client")<
  S3Client,
  S3ClientService
>() {}

export const S3ClientLive = Layer.succeed(S3Client, {
  getFile: (path, bucket) =>
    Effect.gen(function* () {
      return yield* Effect.tryPromise({
        try: async () => {
          const exist = await s3Client.exists(path, {
            bucket: bucket,
          });
          if (!exist) {
            throw new Error("File not found");
          }
          const file = s3Client.file(path, {
            bucket: bucket,
          });
          return file;
        },
        catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
      });
    }).pipe(
      Effect.retry({
        times: 3,
      }),
    ),
  uploadFile: (path, file, bucket) =>
    Effect.tryPromise({
      try: async () =>
        await s3Client.write(path, file, {
          bucket: bucket,
        }),
      catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
    }).pipe(
      Effect.retry({
        times: 3,
      }),
    ),
  uploadFiles: (entries, bucket) =>
    Effect.forEach(
      entries,
      ({ file, key }) =>
        Effect.tryPromise({
          try: async () => {
            await s3Client.write(key, file, {
              bucket: bucket,
            });
          },
          catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
        }).pipe(Effect.retry({ times: 3 })),
      { concurrency: 4 },
    ),
  deleteFile: (path, bucket) =>
    Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: async () => {
          await s3Client.delete(path, {
            bucket: bucket,
          });
        },
        catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
      });
    }).pipe(
      Effect.retry({
        times: 3,
      }),
    ),
});
