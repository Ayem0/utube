import { Schema } from "effect";

export const R2ObjectCreateEventSchema = Schema.Struct({
  account: Schema.String,
  bucket: Schema.String,
  eventTime: Schema.String,
  action: Schema.Literals([
    "PutObject",
    "CopyObject",
    "CompleteMultipartUpload",
  ]),
  object: Schema.Struct({
    key: Schema.String,
    size: Schema.Number,
    eTag: Schema.String,
  }),
  copySource: Schema.optional(
    Schema.Struct({
      bucket: Schema.String,
      object: Schema.String,
    }),
  ),
});

export type R2ObjectCreateEvent = Schema.Schema.Type<
  typeof R2ObjectCreateEventSchema
>;
