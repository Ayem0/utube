import { VideoService } from "@repo/services/video/video-service";
import { Effect } from "effect";
import Elysia from "elysia";
import { authPlugin } from "./auth";
import { apiRuntime } from "./runtime";

const videoController = new Elysia()
  .use(authPlugin)
  .get("/video/:id", async ({ params, status }) => {
    return await apiRuntime.runPromise(
      Effect.gen(function* () {
        const videoService = yield* VideoService;
        return yield* videoService.getWatchById({ id: params.id });
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
    );
  });

export { videoController };
