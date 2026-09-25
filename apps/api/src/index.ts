import cors from "@elysiajs/cors";
import { makeAuth } from "@repo/auth/auth";
import { makeDb } from "@repo/db";
import { env } from "cloudflare:workers";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { channelController } from "./channel-controller";
import { studioController } from "./studio-controller";
import { videoController } from "./video-controller";

const api = new Elysia({
  prefix: "/api",
  adapter: CloudflareAdapter,
  precompile: true,
})
  .use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    }),
  )
  .onError(({ code, error, status }) => {
    console.error("ERROR IN API", {
      code,
      error,
    });

    return status(500, {
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error),
    });
  })
  .all("/auth/*", async ({ request }) => {
    const db = makeDb(env.HYPERDRIVE.connectionString, 1);
    const auth = makeAuth(db, env.BETTER_AUTH_URL, env.BETTER_AUTH_SECRET);
    return await auth.handler(request);
  })
  .use(studioController)
  .use(videoController)

  .use(channelController)
  .compile();

export default api;
export type Api = typeof api;
