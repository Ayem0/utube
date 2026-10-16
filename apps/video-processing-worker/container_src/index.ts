import {
  BunChildProcessSpawner,
  BunFileSystem,
  BunPath,
} from "@effect/platform-bun";
import { DBConfig } from "@repo/services/db/db";
import { S3, type S3Api } from "@repo/services/s3/s3";
import { S3Error } from "@repo/services/s3/s3-errors";
import { VideoPipeline } from "@repo/services/video/video-pipeline";
import { WS, WSMessageError } from "@repo/services/ws/ws";
import { env } from "bun";
import { Effect, Exit, Layer, Redacted, Stream } from "effect";

const wsLayer = Layer.succeed(WS, {
  send: (userId, message) =>
    Effect.tryPromise({
      try: async () => {
        await fetch("http://ws.send", {
          method: "POST",
          body: JSON.stringify({
            userId: userId,
            message: JSON.stringify(message),
          }),
        });
      },
      catch: (err) =>
        new WSMessageError({ cause: err, message: "Error sending ws message" }),
    }).pipe(
      Effect.ignore({
        log: true,
      }),
    ),
});
const uploadFile: S3Api["uploadFile"] = (key, file, bucket, size) =>
  Effect.gen(function* () {
    const readableStream = yield* Stream.toReadableStreamEffect(file);
    yield* Effect.tryPromise({
      try: async () => {
        const res = await fetch(`http://r2.put/${key}`, {
          method: "PUT",
          body: readableStream,
          headers: { "content-length": String(size) },
        });
        if (!res.ok) {
          throw new Error(`R2 upload failed ${res.status}`);
        }
      },
      catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
    });
  });

const s3Layer = Layer.succeed(S3, {
  deleteFile: (key, bucket) => Effect.die("Not implemented"),
  getFile: (key, bucket) =>
    Stream.unwrap(
      Effect.tryPromise({
        try: async () => {
          const res = await fetch(`http://r2.get/${key}`, {
            method: "GET",
          });

          if (!res.ok || !res.body) {
            throw new Error(`R2 GET failed: ${res.status}`);
          }

          return res.body;
        },
        catch: (cause) =>
          new S3Error({
            cause,
            message: "Failed to fetch file",
          }),
      }).pipe(
        Effect.map((body) =>
          Stream.fromReadableStream({
            evaluate: () => body,
            onError: (cause) =>
              new S3Error({
                cause,
                message: "Failed to read response stream",
              }),
          }),
        ),
      ),
    ),

  uploadFile: uploadFile,
  // TODO make it handle retries ...
  uploadFiles: (files, bucket) =>
    Effect.forEach(files, ({ file, key }) => uploadFile(key, file, bucket), {
      concurrency: "unbounded",
    }),
  getPresignedUrl: (params) =>
    Effect.tryPromise({
      try: async () => {
        const res = await fetch(`http://r2.presign/${params.path}`, {
          method: "GET",
        });
        if (res.body) {
          const { url }: { url: string } = await res.json();
          return url;
        }
        throw new Error("Response doesnt contain a stream body");
      },
      catch: (e) =>
        new S3Error({
          cause: e,
          message: "S3Error",
        }),
    }),
});

const dbConfigLayer = Layer.sync(DBConfig, () => ({
  url: Redacted.make(env.DATABASE_URL!),
}));

const appLayer = Layer.provideMerge(
  VideoPipeline.Layer,
  Layer.provideMerge(
    Layer.mergeAll(
      s3Layer,
      dbConfigLayer,
      wsLayer,
      BunChildProcessSpawner.layer,
    ),
    Layer.mergeAll(BunFileSystem.layer, BunPath.layer),
  ),
);

Bun.serve({
  port: 8080,
  async fetch(request) {
    try {
      const body: { assetId: string } = await request.json();

      const exit = await Effect.runPromiseExit(
        Effect.scoped(
          Effect.gen(function* () {
            const videoPipeline = yield* VideoPipeline;
            yield* videoPipeline.processVideo(body);
          }).pipe(Effect.provide(appLayer)),
        ),
      );

      if (Exit.isFailure(exit)) {
        console.error("Processing error", JSON.stringify(exit.cause));
        return Response.json(
          {
            success: false,
            error: JSON.stringify(exit.cause),
          },
          {
            status: 500,
          },
        );
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Processing error", JSON.stringify(error));

      return Response.json(
        {
          success: false,
          error: JSON.stringify(error),
        },
        {
          status: 500,
        },
      );
    }
  },
});
