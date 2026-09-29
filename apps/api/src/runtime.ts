import { ChannelRepository } from "@repo/services/channel/channel-repository";
import { DBConfig } from "@repo/services/db/db";
import { S3 } from "@repo/services/s3/s3";
import { S3Error } from "@repo/services/s3/s3-errors";
import {
  VideoPlayback,
  VideoPlaybackConfig,
} from "@repo/services/video/video-playback";
import { VideoRepository } from "@repo/services/video/video-repository";
import { VideoService } from "@repo/services/video/video-service";
import { Effect, Layer, Redacted } from "effect";
import Elysia from "elysia";
import { Env } from "./env";

const S3Layer = Layer.sync(S3, () => {
  // const client = new S3Client({
  //   credentials: {
  //     accessKeyId: Env.R2_ACCESS_KEY_ID,
  //     secretAccessKey: Env.R2_SECRET_ACCESS_KEY,
  //   },
  //   region: Env.R2_REGION,
  //   endpoint: Env.R2_ENDPOINT,
  //   forcePathStyle: true,
  // });

  return {
    uploadFiles: () => Effect.succeed(void 0),
    getFile: () => Effect.succeed(new Uint8Array()),
    deleteFile: () => Effect.succeed(void 0),
    getPresignedUrl: ({ bucket, expiresIn = 60, mimeType, path, method }) =>
      Effect.tryPromise({
        try: async () => {
          // const command = new PutObjectCommand({
          //   Bucket: bucket,
          //   Key: path,
          //   ContentType: mimeType,
          // });

          // const presignedUrl = await getSignedUrl(client, command, {
          //   expiresIn,
          // });

          return `http://localhost:8790/${path}`; // TODO REMOVE VOIR COMMENT FAIRE UN LAYER PROD ET UN DEV

          // return presignedUrl;
        },
        catch: (error) => new S3Error({ cause: error, message: "S3Error" }),
      }),
    uploadFile: () => Effect.succeed(void 0),
  };
});

const dbConfigLayer = Layer.sync(DBConfig, () => {
  return {
    url: Redacted.make(Env.HYPERDRIVE.connectionString),
  };
});

const videoPlaybackConfigLayer = Layer.sync(VideoPlaybackConfig, () => ({
  secret: Redacted.make(Env.VIDEO_PLAYBACK_SECRET),
}));

export const liveLayer = Layer.provideMerge(
  Layer.mergeAll(
    VideoService.Layer,
    VideoRepository.Layer,
    ChannelRepository.Layer,
  ),
  Layer.provideMerge(
    VideoPlayback.Layer,
    Layer.mergeAll(S3Layer, dbConfigLayer, videoPlaybackConfigLayer),
  ),
);

type LayerServices<T> =
  T extends Layer.Layer<infer S, unknown, unknown> ? S : never;

const runEffect = <A, E>(
  effect: Effect.Effect<A, E, LayerServices<typeof liveLayer>>,
) => {
  return Effect.runPromise(effect.pipe(Effect.provide(liveLayer)));
};

export const runtimePlugin = new Elysia({
  name: "effectRuntime",
}).macro({
  runtime: {
    resolve() {
      return {
        runEffect: runEffect,
      };
    },
  },
});
