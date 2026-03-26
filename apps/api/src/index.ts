import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { authPlugin } from "./auth";
import { channelController } from "./channel-controller";
import { studioController } from "./studio-controller";
import { videoController } from "./video-controller";

export const api = new Elysia({
  prefix: "/api",
})
  .use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    }),
  )
  .use(studioController)
  .use(videoController)
  .use(channelController)
  .use(authPlugin)
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${api.server?.hostname}:${api.server?.port}`,
);

export type Api = typeof api;
