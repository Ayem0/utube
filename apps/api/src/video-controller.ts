import { VideoPublisher } from "@repo/services/video/video-publisher";
import { VideoRepository } from "@repo/services/video/video-repository";
import { videoUploadSchema } from "@repo/types/schemas/video-upload";
import type { VideoUpload } from "@repo/types/types/video-upload";
import { Effect } from "effect";
import Elysia, { fileType } from "elysia";
import { authPlugin } from "./auth";
import { apiRuntime } from "./runtime";

const postVideo = (body: VideoUpload) =>
  Effect.gen(function* () {
    const videoPublisher = yield* VideoPublisher;
    const res = yield* videoPublisher.publishVideo(
      body.channelId,
      body.title,
      body.description,
      body.image,
      body.video,
    );
    return res;
  });
const getVideo = (id: string) =>
  Effect.gen(function* () {
    const videoRepository = yield* VideoRepository;
    const res = yield* videoRepository.getById(id);
    return res;
  });
const videoController = new Elysia()
  .use(authPlugin)
  .post(
    "/video",
    async ({ body, status }) => {
      return await apiRuntime.runPromise(
        postVideo(body).pipe(
          Effect.match({
            onSuccess: (res) => {
              return status(201, res);
            },
            onFailure: (e) => {
              console.log("ERROR", e);
              if (
                e._tag === "InvalidMediaSizeError" ||
                e._tag === "InvalidMediaTypeError"
              ) {
                return status(400, e.message);
              } else {
                return status(500);
              }
            },
          }),
        ),
      );
    },
    {
      body: videoUploadSchema.extend({
        // Refine using elysia utility function to handle files
        image: videoUploadSchema.shape.image.refine((f) =>
          fileType(f, ["image/jpeg", "image/png", "image/webp"]),
        ),
        video: videoUploadSchema.shape.video.refine((f) =>
          fileType(f, ["video/mp4", "video/webm"]),
        ),
      }),
      auth: true,
    },
  )
  .get("/video/:id", async ({ params, status }) => {
    return await apiRuntime.runPromise(
      getVideo(params.id).pipe(
        Effect.match({
          onSuccess: (res) => {
            return status(200, res);
          },
          onFailure: (e) => {
            console.log("ERROR", e);
            if (e._tag === "NotFoundError") {
              return status(404);
            } else {
              return status(500);
            }
          },
        }),
      ),
    );
  });

export { videoController };
