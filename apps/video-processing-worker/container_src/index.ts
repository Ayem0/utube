import { DBConfig } from "@repo/services/db/db";
import { S3, type S3Api } from "@repo/services/s3/s3";
import { S3Error } from "@repo/services/s3/s3-errors";
import { VideoPipeline } from "@repo/services/video/video-pipeline";
import { WS, WSMessageError } from "@repo/services/ws/ws";
import { env } from "bun";
import { Effect, Exit, Layer, Redacted } from "effect";

const s3Client = new Bun.S3Client({
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  endpoint: env.R2_ENDPOINT,
  region: env.R2_REGION,
});

const wsLayer = Layer.succeed(WS, {
  send: (userId, message) =>
    Effect.tryPromise({
      try: async () => {
        await fetch("http://ws.send", {
          method: "POST",
          body: JSON.stringify({
            userId: userId,
            message: message,
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
const uploadFile: S3Api["uploadFile"] = (key, file, bucket) =>
  Effect.tryPromise({
    try: async () => {
      const body = new Uint8Array(file);
      await fetch(`http://r2.put/${key}`, {
        method: "PUT",
        body: body,
      });
    },
    catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
  });

const s3Layer = Layer.succeed(S3, {
  deleteFile: (key, bucket) =>
    Effect.tryPromise({
      try: async () => {
        await s3Client.delete(key, {
          bucket: bucket,
        });
      },
      catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
    }),
  getFile: (key, bucket) =>
    Effect.tryPromise({
      try: async () => {
        const res = await fetch(`http://r2.get/${key}`, {
          method: "GET",
        });
        return await res.bytes();
      },
      catch: (e) => new S3Error({ cause: e, message: "S3Error" }),
    }),
  uploadFile: uploadFile,
  // TODO make it handle retries ...
  uploadFiles: (files, bucket) =>
    Effect.forEach(files, ({ file, key }) => uploadFile(key, file, bucket), {
      concurrency: "unbounded",
    }),
  getPresignedUrl: ({ bucket, mimeType, path, expiresIn, method }) =>
    Effect.succeed(
      s3Client.presign(path, {
        bucket: bucket,
        type: mimeType,
        expiresIn: expiresIn,
        method: method,
      }),
    ),
});

const dbConfigLayer = Layer.sync(DBConfig, () => ({
  url: Redacted.make(env.DATABASE_URL!),
}));

const appLayer = VideoPipeline.Layer.pipe(
  Layer.provide(s3Layer),
  Layer.provide(dbConfigLayer),
  Layer.provide(wsLayer),
);

Bun.serve({
  port: 8080,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "POST" || url.pathname !== "/process") {
      return new Response("Not found", {
        status: 404,
      });
    }
    try {
      const body = await request.json<{ assetId: string }>();

      const exit = await Effect.runPromiseExit(
        Effect.tapError(
          Effect.gen(function* () {
            const videoPipeline = yield* VideoPipeline;
            yield* videoPipeline.processVideo(body);
          }).pipe(Effect.provide(appLayer)),
          (error) =>
            Effect.succeed(() => {
              console.log("ERROR: ", error);
            }),
        ),
      );

      if (Exit.isFailure(exit)) {
        console.error("Processing error", JSON.stringify(exit.cause));
        return Response.json(
          {
            success: false,
          },
          {
            status: 500,
          },
        );
      }

      return Response.json({
        success: true,
      });
    } catch (error) {
      console.error("Processing error", JSON.stringify(error));

      return Response.json(
        {
          success: false,
        },
        {
          status: 500,
        },
      );
    }
  },
});
