import { Data } from "effect";

export class VideoProcessingError extends Data.TaggedError(
  "VideoProcessingError",
)<{ cause: unknown; message: string }> {}
