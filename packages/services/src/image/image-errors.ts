import { Data } from "effect";

export class ImageProcessingError extends Data.TaggedError(
  "ImageProcessingError",
)<{ readonly message: string; readonly cause: unknown }> {}

export class InvalidAssetTypeError extends Data.TaggedError(
  "InvalidAssetTypeError",
)<{ readonly message: string }> {}
