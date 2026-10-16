// import {
//   VideoPlayback,
//   VideoPlaybackConfig,
// } from "@repo/services/video/video-playback";
// import { WorkerEntrypoint } from "cloudflare:workers";
// import { Effect, Layer, Redacted } from "effect";
// import type { VideoStorageWorkerEnv } from "../alchemy.run";

// interface EntrypointExports {
//   Cached: Fetcher;
// }

// export class Cached extends WorkerEntrypoint<VideoStorageWorkerEnv> {
//   async fetch(request: Request) {
//     const { pathname } = new URL(request.url);
//     const key = pathname.substring(1);
//     try {
//       const res = await this.env.VIDEOS_BUCKET.get(key);
//       return new Response(res?.body, {
//         status: res?.body ? 200 : 404,
//         headers: {
//           "Cache-Control": "public, max-age=86400",
//           "Access-Control-Allow-Origin": "http://localhost:3000",
//         },
//       });
//     } catch (error) {
//       return new Response(null, { status: 500 });
//     }
//   }
// }

// export default {
//   async fetch(request, env, ctx) {
//     if (request.method === "GET") {
//       const { pathname, searchParams } = new URL(request.url);

//       const token = searchParams.get("verify");

//       if (!token) return new Response("Unauthorized", { status: 401 });

//       const videoPlaybackConfigLayer = Layer.succeed(VideoPlaybackConfig, {
//         secret: Redacted.make(env.VIDEO_PLAYBACK_SECRET),
//       });
//       const layer = Layer.provideMerge(
//         VideoPlayback.Layer,
//         videoPlaybackConfigLayer,
//       );

//       const valid = await Effect.runPromise(
//         Effect.gen(function* () {
//           const videoPlaybackApi = yield* VideoPlayback;
//           return yield* videoPlaybackApi.validatePlaybackToken({
//             token,
//             pathname,
//           });
//         }).pipe(Effect.provide(layer)),
//       );

//       if (!valid) {
//         return new Response("Forbidden", { status: 403 });
//       }

//       const forwarded = new Request(request);
//       forwarded.headers.delete("AUTHORIZATION");
//       forwarded.headers.delete("Authorization");
//       forwarded.headers.delete("authorization");
//       const exports = ctx.exports as EntrypointExports;
//       return exports.Cached.fetch(forwarded);
//     }
//     return new Response(null, { status: 404 });
//   },
// } satisfies ExportedHandler<VideoStorageWorkerEnv>;
