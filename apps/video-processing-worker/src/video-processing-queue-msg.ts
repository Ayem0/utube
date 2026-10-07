import { Schema } from "effect";

export const VideoProcessingQueueMsg = Schema.Struct({
  account: Schema.String,
  bucket: Schema.String,
  eventTime: Schema.String,
  action: Schema.Literals([
    "PutObject",
    "CopyObject",
    "CompleteMultipartUpload",
    "DeleteObject",
  ]),
  object: Schema.Struct({
    key: Schema.String,
    size: Schema.Number,
    eTag: Schema.String,
  }),
});

export type VideoProcessingQueueMsg = Schema.Schema.Type<
  typeof VideoProcessingQueueMsg
>;
