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
import * as Cloudflare from "alchemy/Cloudflare";
import { AwsClient } from "aws4fetch";
import { Effect, Layer, Redacted } from "effect";
import Elysia from "elysia";
import { Env } from "./env";

const S3Layer = Layer.sync(S3, () => {
  return {
    uploadFiles: () => Effect.succeed(void 0),
    getFile: () => Effect.succeed(new Uint8Array()),
    deleteFile: () => Effect.succeed(void 0),
    getPresignedUrl: ({ bucket, expiresIn = 60, mimeType, path, method }) =>
      Effect.tryPromise({
        try: async () => {
          const s3: Cloudflare.R2.S3CredentialsValue = JSON.parse(
            Env.S3Credentials,
          );
          const client = new AwsClient({ ...s3, service: "s3" });
          const url = new URL(
            `${s3.endpoint}/${encodeURIComponent(s3.bucketName)}/${path}`,
          );
          url.searchParams.set("X-Amz-Expires", expiresIn.toString());
          const signed = await client.sign(url.toString(), {
            method: "PUT",
            aws: { signQuery: true },
          });
          return signed.url;
        },
        catch: (e) =>
          new S3Error({ message: "S3 error in get presigned url", cause: e }),
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
