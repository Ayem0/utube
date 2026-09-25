import {
  VideoPlayback,
  VideoPlaybackConfig,
} from "@repo/services/video/video-playback";
import { env } from "cloudflare:workers";
import { Effect, Layer, Redacted } from "effect";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method === "GET") {
      const { pathname, searchParams } = new URL(request.url);

      const token = searchParams.get("verify");

      if (!token) return new Response(null, { status: 401 });

      const valid = await Effect.runPromise(
        Effect.gen(function* () {
          const videoPlaybackApi = yield* VideoPlayback;
          return yield* videoPlaybackApi.validatePlaybackToken({
            token,
            pathname,
          });
        }).pipe(Effect.provide(layer)),
      );

      if (!valid)
        return new Response(null, { status: 403, headers: corsHeaders });

      console.log("pathname", pathname);
      const obj = await env.VIDEOS.get(pathname.replace("/videos/", "/"));

      if (!obj)
        return new Response(null, { status: 404, headers: corsHeaders });
      return new Response(obj.body, { headers: corsHeaders });
    } else if (request.method === "PUT") {
      const { pathname } = new URL(request.url);
      if (!pathname)
        return new Response(null, { status: 400, headers: corsHeaders });

      await env.VIDEOS.put(pathname, request.body);
      const r2Event: R2EventNotification = {
        account: "local",
        action: "PutObject",
        bucket: "videos",
        object: {
          eTag: "",
          size: 0,
          key: decodeURIComponent(
            pathname.replace(/\+/g, " ").replace("/videos", ""),
          ),
        },
        eventTime: "",
      };
      await env.VIDEO_PROCESSING_QUEUE.send(r2Event);

      return new Response(null, { status: 201, headers: corsHeaders });
    }
    return new Response(null, { status: 404, headers: corsHeaders });
  },
} satisfies ExportedHandler<Env>;

const videoPlaybackConfigLayer = Layer.sync(VideoPlaybackConfig, () => ({
  secret: Redacted.make(env.VIDEO_PLAYBACK_SECRET),
}));
const layer = Layer.provideMerge(VideoPlayback.Layer, videoPlaybackConfigLayer);

type R2EventNotification = {
  account: string;
  action:
    | "PutObject"
    | "CopyObject"
    | "CompleteMultipartUpload"
    | "DeleteObject"
    | "LifecycleDeletion"
    | (string & {});
  bucket: string;
  object: {
    key: string;
    size: number;
    eTag: string;
  };
  eventTime: string;
  copySource?: {
    bucket: string;
    object: string;
  };
};
