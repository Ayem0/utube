import { Schema } from "effect";
import { SchemaFalse, SchemaTrue } from "./schema";
import { VideoMetadataValidated } from "./video-metadata";

export const VideoValidateSuccess = Schema.Struct({
  valid: SchemaTrue,
  metadata: VideoMetadataValidated,
});

export const VideoValidateFailure = Schema.Struct({
  valid: SchemaFalse,
  reason: Schema.String,
});

export const VideoValidateResult = Schema.Union([
  VideoValidateFailure,
  VideoValidateSuccess,
]);
export type VideoValidateResult = typeof VideoValidateResult.Type;
