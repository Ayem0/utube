import { Schema } from "effect";

export const videoMetadataSchema = Schema.Struct({
  streams: Schema.optional(
    Schema.Array(
      Schema.Struct({
        codec_type: Schema.optional(Schema.String),
        codec_name: Schema.optional(Schema.String),

        width: Schema.optional(Schema.Number),
        height: Schema.optional(Schema.Number),

        r_frame_rate: Schema.optional(Schema.String),
        avg_frame_rate: Schema.optional(Schema.String),

        pix_fmt: Schema.optional(Schema.String),

        bit_rate: Schema.optional(Schema.NumberFromString),
        nb_frames: Schema.optional(Schema.NumberFromString),

        display_aspect_ratio: Schema.optional(Schema.String),

        channels: Schema.optional(Schema.Number),
        sample_rate: Schema.optional(Schema.NumberFromString),

        color_space: Schema.optional(Schema.String),
        color_transfer: Schema.optional(Schema.String),
        color_primaries: Schema.optional(Schema.String),

        tags: Schema.optional(
          Schema.Struct({
            rotate: Schema.optional(Schema.NumberFromString),
          }),
        ),
        side_data_list: Schema.optional(
          Schema.Array(
            Schema.Struct({
              rotation: Schema.optional(Schema.Number),
            }),
          ),
        ),
      }),
    ),
  ),
  format: Schema.optional(
    Schema.Struct({
      duration: Schema.optional(Schema.NumberFromString),
      size: Schema.optional(Schema.NumberFromString),
      bit_rate: Schema.optional(Schema.NumberFromString),
      format_name: Schema.optional(Schema.String),
    }),
  ),
});

export type VideoMetadata = Schema.Schema.Type<typeof videoMetadataSchema>;
