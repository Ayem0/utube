import { Context, Effect, Layer } from "effect";
import { s3 } from "../../s3";
import { S3Error } from "./s3-errors";

export interface S3ClientService {
  getFile: (
    path: string,
    bucket: string,
  ) => Effect.Effect<Bun.S3File, S3Error, never>;
  uploadFile: (
    path: string,
    file: File,
    bucket: string,
  ) => Effect.Effect<void, S3Error, never>;
  deleteFile: (
    path: string,
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
          const exist = await s3.exists(path, {
            bucket: bucket,
          });
          if (!exist) {
            throw new Error("File not found");
          }
          const file = s3.file(path, {
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
    Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: async () =>
          await s3.write(path, file, {
            bucket: bucket,
          }),
        catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
      });
    }).pipe(
      Effect.retry({
        times: 3,
      }),
    ),
  deleteFile: (path, bucket) =>
    Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: async () => {
          const exist = await s3.exists(path, {
            bucket: bucket,
          });
          if (!exist) {
            throw new Error("File not found");
          }
          await s3.delete(path, {
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
