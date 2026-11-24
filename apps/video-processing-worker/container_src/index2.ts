import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { AssetRepository } from "@repo/services/asset/asset-repository";
import { DBConfig } from "@repo/services/db/db";
import { S3 } from "@repo/services/s3/s3";
import { S3Error } from "@repo/services/s3/s3-errors";
import { VideoProcessor } from "@repo/services/video/video-processor";
import { VideoValidator } from "@repo/services/video/video-validator";
import {
  VideoMetadataValidated,
  VideoValidateResult,
} from "@repo/types/effect/schemas";
import { Context, Effect, Layer, Redacted, Schema, Stream } from "effect";
import { HttpRouter } from "effect/http";
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
} from "effect/http-api";

const Api = HttpApi.make("api").add(
  HttpApiGroup.make("transcode").add(
    HttpApiEndpoint.post("transcode", "/transcode", {
      payload: Schema.Struct({
        assetId: Schema.String,
        videoMetadata: VideoMetadataValidated,
      }),
      success: Schema.Struct({}),
      error: [HttpApiError.NotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("validate", "/validate", {
      payload: Schema.Struct({
        assetId: Schema.String,
      }),
      success: VideoValidateResult,
      error: [HttpApiError.NotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("track", "/track", {
      payload: Schema.Struct({}),
      success: Schema.Struct({}),
    }),
  ),
);

const TranscodeLayer = HttpApiBuilder.group(Api, "transcode", (handlers) =>
  Effect.gen(function* () {
    const s3 = yield* S3;
    const videoValidator = yield* VideoValidator;
    const assetRepo = yield* AssetRepository;
    const videoProcessor = yield* VideoProcessor;
    return handlers.handleAll({
      transcode: Effect.fn(
        function* ({ payload }) {
          const asset = yield* assetRepo.getById({ assetId: payload.assetId });
          const url = yield* s3.getPresignedUrl({
            key: asset.originalStorageKey,
            bucket: "uploads",
            method: "GET",
            expiresInSeconds: 60 * 60 * 6,
          });

          // start the background transcode
          yield* Effect.forkDetach(
            Effect.gen(function* () {
              yield* videoProcessor.transcode({
                metadata: payload.videoMetadata,
                input: url,
                outputDir: payload.assetId,
              });
            }),
          );
          return {};
        },
        Effect.mapError((error) =>
          error._tag === "DBNotFoundError"
            ? new HttpApiError.NotFound()
            : new HttpApiError.InternalServerError(),
        ),
      ),
      validate: Effect.fn(
        function* ({ payload }) {
          const asset = yield* assetRepo.getById({ assetId: payload.assetId });
          const url = yield* s3.getPresignedUrl({
            key: asset.originalStorageKey,
            bucket: "uploads",
            method: "GET",
            expiresInSeconds: 60 * 60,
          });
          return yield* videoValidator.validateVideo(url);
        },
        Effect.mapError((cause) =>
          cause._tag === "DBNotFoundError"
            ? new HttpApiError.NotFound()
            : new HttpApiError.InternalServerError(),
        ),
      ),
      track: Effect.fn(function* () {
        return {};
      }),
    });
  }),
);

const S3Layer = Layer.succeed(S3, {
  getPresignedUrl: (params) =>
    Effect.tryPromise({
      try: async () => {
        const res = await fetch(`http://r2.presign/${params.key}`, {
          method: "GET",
        });
        if (res.body) {
          const { url }: { url: string } = await res.json();
          return url;
        }
        throw new Error("Response doesnt contain a stream body");
      },
      catch: (e) => new S3Error({ cause: e, message: "S3 Error" }),
    }),
  deleteFile: () => Effect.die("Not implemented"),
  getFile: () => Stream.die("Not implemented"),
  uploadFile: Effect.fn(function* <E, R>({
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
  }),
});

const DBConfigLayer = Layer.succeed(DBConfig, {
  url: Redacted.make(process.env.DATABASE_URL!),
});

const ServerLayer = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(TranscodeLayer),
  Layer.provide(VideoValidator.Layer),
  Layer.provide(AssetRepository.Layer),
  Layer.provide(S3Layer),
  Layer.provide(DBConfigLayer),
  Layer.provide(VideoProcessor.Layer),
  // HttpRouter.provideRequest(Layer.succeed(HttpServerState, { map: new Map() })),
  HttpRouter.serve,
  Layer.provide(BunHttpServer.layer({ port: 8080 })),
);

Layer.launch(ServerLayer).pipe(BunRuntime.runMain);

export class HttpServerState extends Context.Service<
  HttpServerState,
  {
    readonly map: Map<string, unknown>;
  }
>()("HttpServerState", {
  make: Effect.gen(function* () {
    return {
      map: new Map(),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make);
}
