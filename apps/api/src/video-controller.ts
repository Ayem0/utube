import { VideoPublisher } from "@repo/shared/services/media/video-publisher";
import type { VideoUploadSchema } from "@repo/shared/types/video/video-upload-schema";
import { videoUploadSchema } from "@repo/shared/types/video/video-upload-schema";
import { Effect } from "effect";
import Elysia, { fileType } from "elysia";
import { authPlugin } from "./auth";
import { apiRuntime } from "./runtime";

const program = (body: VideoUploadSchema) =>
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

const videoController = new Elysia().use(authPlugin).post(
  "/video",
  async ({ body, status }) => {
    return await apiRuntime.runPromise(
      program(body).pipe(
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
);

export { videoController };
