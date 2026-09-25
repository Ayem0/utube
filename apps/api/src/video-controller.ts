import { VideoService } from "@repo/services/video/video-service";
import { Effect } from "effect";
import Elysia from "elysia";
import { authMacro } from "./auth";
import { runtimePlugin } from "./runtime";

const videoController = new Elysia()
  .use(authMacro)
  .use(runtimePlugin)
  .get(
    "/video/:id",
    async ({ params, status, user, runEffect }) =>
      runEffect(
        Effect.gen(function* () {
          const videoService = yield* VideoService;
          return yield* videoService.getWatchById({
            id: params.id,
            userId: user?.id,
          });
        }).pipe(
          Effect.match({
            onSuccess: (value) => {
              return status(200, value);
            },
            onFailure: (err) => {
              console.log("ERROR: ", err);
              switch (err._tag) {
                case "DBNotFoundError":
                  return status(404);
                default:
                  return status(500);
              }
            },
          }),
        ),
      ),
    {
      optionalAuth: true,
      runtime: true,
    },
  )
  .get(
    "/video/:id/refresh",
    async ({ params, status, user, runEffect }) =>
      runEffect(
        Effect.gen(function* () {
          const videoService = yield* VideoService;
          return yield* videoService.refreshPlaybackToken({
            videoId: params.id,
            userId: user?.id,
          });
        }).pipe(
          Effect.match({
            onSuccess: (value) => {
              return status(200, value);
            },
            onFailure: (err) => {
              console.log("ERROR: ", err);
              switch (err._tag) {
                case "DBNotFoundError":
                  return status(404);
                case "VideoPlaybackError":
                  return status(403);
                default:
                  return status(500);
              }
            },
          }),
        ),
      ),
    {
      optionalAuth: true,
      runtime: true,
    },
  );

export { videoController };
