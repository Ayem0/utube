import { DBConfig } from "@repo/services/db/db";
import { ImageProcessingError } from "@repo/services/image/image-errors";
import { ImagePipeline } from "@repo/services/image/image-pipeline";
import {
  ImageProcessor,
  ProcessedVariant,
} from "@repo/services/image/image-processor";
import { ImageProcessorConfig } from "@repo/services/image/image-processor-config";
import {
  ImageValidationError,
  ImageValidator,
} from "@repo/services/image/image-validator";
import { MediaValidatorConfig } from "@repo/services/media/media-validator-config";
import { S3 } from "@repo/services/s3/s3";
import { S3Error } from "@repo/services/s3/s3-errors";
import { WS, WSMessageError } from "@repo/services/ws/ws";
import type { ImageAssetType } from "@repo/types/enums/image/image-type";
import { entries, fromEntries } from "@repo/types/utils/typed-entries";
import { env } from "bun";
import { Effect, Layer, Redacted, Stream } from "effect";

Bun.serve({
  port: 8080,
  async fetch(req) {
    try {
      const body: { assetId: string } = await req.json();
      const exit = await Effect.runPromiseExit(program(body.assetId));
      if (exit._tag === "Failure") {
        console.log("exit failure:", JSON.stringify(exit.cause));
        return Response.json(
          { error: JSON.stringify(exit.cause) },
          { status: 500 },
        );
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      console.log("Error processing image:", error);
      return Response.json({ error: JSON.stringify(error) }, { status: 500 });
    }
  },
});

const imageValidatorLayer = Layer.effect(
  ImageValidator,
  Effect.gen(function* () {
    const cfg = yield* MediaValidatorConfig;
    return {
      validate: Effect.fnUntraced(function* ({ input, type }) {
        const img = new Bun.Image(input);

        const metadata = yield* Effect.tryPromise({
          try: async () => {
            const data = await img.metadata();
            return data;
          },
          catch: (e) =>
            new ImageValidationError({
              message: "Error reading image metadata",
              cause: e,
            }),
        });

        if (
          metadata.width <= 0 ||
          metadata.height <= 0 ||
          metadata.width * metadata.height > cfg.maxImageResolution
        ) {
          return { valid: false, reason: "Invalid image dimensions." };
        }

        if (!cfg.allowedImageFormats.includes(metadata.format)) {
          return { valid: false, reason: "Unsupported image format." };
        }

        return { valid: true };
      }),
    };
  }),
).pipe(Layer.provide(MediaValidatorConfig.Layer));

const imageProcessorLayer = Layer.effect(
  ImageProcessor,
  Effect.gen(function* () {
    const cfg = yield* ImageProcessorConfig;
    return {
      process: Effect.fnUntraced(function* <T extends ImageAssetType>({
        input,
        type,
      }: {
        input: string | ArrayBuffer | NodeJS.TypedArray | Blob;
        type: T;
      }) {
        const img = new Bun.Image(input);
        const map = cfg.IMAGE_PROCESSING_CONFIG_MAP[type];
        const out = yield* Effect.forEach(
          entries(map),
          ([variant, options]) =>
            Effect.tryPromise({
              try: async () => {
                const buffer = await img
                  .resize(options.width, options.height, { fit: "inside" })
                  .webp({
                    quality: options.quality,
                    lossless: options.loseless,
                  })
                  .buffer();
                return { buffer, key: `${variant.toString()}.webp`, variant };
              },
              catch: (e) => {
                console.log("Error processing image", e);
                return new ImageProcessingError({
                  cause: e,
                  message: "Error processing image",
                });
              },
            }),
          { concurrency: 4 },
        );

        const res = fromEntries(
          out.map((o) => [o.variant, { buffer: o.buffer, key: o.key }]),
        );
        return res as ProcessedVariant<T>;
      }),
    };
  }),
).pipe(Layer.provide(ImageProcessorConfig.Layer));

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

const s3Layer = Layer.succeed(S3, {
  uploadFile: Effect.fnUntraced(function* <E, R>({
    bucket,
    file,
    key,
    size,
  }: {
    key: string;
    file: Stream.Stream<Uint8Array, E, R> | Uint8Array;
    bucket: string;
    size?: bigint;
  }) {
    const readableStream = yield* Stream.toReadableStreamEffect(
      Stream.isStream(file) ? file : Stream.fromArray([file]),
    );
    yield* Effect.tryPromise({
      try: async () => {
        if (!size) throw new Error("No size provided");

        const res = await fetch(`http://r2.put/${key}`, {
          method: "PUT",
          body: readableStream,
          headers: { "content-length": String(size) },
        });
        console.log("RES", res);
        if (!res.ok) {
          console.log("R2 upload failed", res);
          throw new Error(`R2 upload failed ${res.status}`);
        }
      },
      catch: (cause) => {
        console.log("R2 UPLOAD FAIL:", cause);
        return new S3Error({ cause, message: "S3Error" });
      },
    });
  }),
  deleteFile: (key, bucket) => Effect.die("Not implemented"),
  getFile: ({ key, bucket }) =>
    Stream.unwrap(
      Effect.tryPromise({
        try: async () => {
          const res = await fetch(`http://r2.get/${key}`, {
            method: "GET",
          });

          if (!res.ok || !res.body) {
            console.log("R2 GET failed", res);
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
  getPresignedUrl: (params) => Effect.die("Not implemented"),
});

const dbConfigLayer = Layer.succeed(DBConfig, {
  url: Redacted.make(env.DATABASE_URL!),
});

const layer = Layer.provideMerge(
  ImagePipeline.Layer,
  Layer.mergeAll(
    imageProcessorLayer,
    imageValidatorLayer,
    s3Layer,
    wsLayer,
    dbConfigLayer,
  ),
);

const program = (assetId: string) =>
  Effect.gen(function* () {
    const pipeline = yield* ImagePipeline;
    yield* pipeline.process({ assetId });
  }).pipe(Effect.provide(layer));
