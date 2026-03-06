import { Context, Effect, Layer } from "effect";
import { InvalidMediaSizeError, InvalidMediaTypeError } from "./media-errors";

export class MediaValidator extends Context.Tag("MediaValidator")<
  MediaValidator,
  MediaValidator.Service
>() {}

const ALLOWED_IMAGE_TYPES: string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

const ALLOWED_VIDEO_TYPES: string[] = ["video/mp4"] as const;

const MAX_IMAGE_BYTES = 5_000_000 as const; // 5 MB
const MAX_VIDEO_BYTES = 10_000_000_000 as const; // 10 GB

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MediaValidator {
  export const makeLive = () => ({
    validateImage: (image: File) =>
      Effect.gen(function* () {
        if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
          return yield* Effect.fail(
            new InvalidMediaTypeError({ message: "Invalid media type" }),
          );
        }
        if (image.size > MAX_IMAGE_BYTES) {
          return yield* Effect.fail(
            new InvalidMediaSizeError({ message: "Invalid media size" }),
          );
        }
        return {
          size: image.size,
          type: image.type,
        };
      }),
    validateVideo: (video: File) =>
      Effect.gen(function* () {
        if (!ALLOWED_VIDEO_TYPES.includes(video.type)) {
          return yield* Effect.fail(
            new InvalidMediaTypeError({ message: "Invalid media type" }),
          );
        }
        if (video.size > MAX_VIDEO_BYTES) {
          return yield* Effect.fail(
            new InvalidMediaSizeError({ message: "Invalid media size" }),
          );
        }
        return {
          size: video.size,
          type: video.type,
        };
      }),
  });
  export type Service = ReturnType<typeof makeLive>;

  export const Live = Layer.succeed(MediaValidator, MediaValidator.makeLive());
}
