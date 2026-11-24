import { Effect, Schema, SchemaGetter, SchemaIssue } from "effect";

export const VideoMetadataFormatSchema = Schema.Struct({
  duration: Schema.FiniteFromString,
  size: Schema.optional(Schema.FiniteFromString),
  bit_rate: Schema.optional(Schema.FiniteFromString),
  format_name: Schema.optional(Schema.String),
});

export type VideoMetadataFormat = Schema.Schema.Type<
  typeof VideoMetadataFormatSchema
>;

export const VideoMetadataFormatValidatedSchema = Schema.Struct({
  duration: Schema.FiniteFromString.pipe(Schema.check(Schema.isGreaterThan(0))),
  size: Schema.FiniteFromString.pipe(Schema.check(Schema.isGreaterThan(0))),
  format_name: Schema.String,
  bit_rate: Schema.optional(Schema.FiniteFromString),
});
export type VideoMetadataFormatValidated = Schema.Schema.Type<
  typeof VideoMetadataFormatValidatedSchema
>;

export const VideoMetadataSchema = Schema.Struct({
  streams: Schema.optional(
    Schema.Array(
      Schema.Struct({
        index: Schema.Number,

        codec_type: Schema.optional(Schema.String),
        codec_name: Schema.optional(Schema.String),

        width: Schema.optional(Schema.Number),
        height: Schema.optional(Schema.Number),

        bit_rate: Schema.optional(Schema.NumberFromString),
        nb_frames: Schema.optional(Schema.NumberFromString),

        r_frame_rate: Schema.optional(Schema.String),
        avg_frame_rate: Schema.optional(Schema.String),

        pix_fmt: Schema.optional(Schema.String),

        display_aspect_ratio: Schema.optional(Schema.String),

        channels: Schema.optional(Schema.Number),
        sample_rate: Schema.optional(Schema.NumberFromString),

        color_space: Schema.optional(Schema.String),
        color_transfer: Schema.optional(Schema.String),
        color_primaries: Schema.optional(Schema.String),
        disposition: Schema.optional(
          Schema.Struct({
            default: Schema.optional(Schema.BooleanFromBit),
          }),
        ),

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
  format: Schema.optional(VideoMetadataFormatSchema),
});

export type VideoMetadata = Schema.Schema.Type<typeof VideoMetadataSchema>;

export const VideoMetadataVideoStreamSchemaBase = Schema.Struct({
  index: Schema.Number,
  codec_type: Schema.Literal("video"),
  codec_name: Schema.String,

  width: Schema.Finite.pipe(Schema.check(Schema.isGreaterThan(0))),
  height: Schema.Finite.pipe(Schema.check(Schema.isGreaterThan(0))),

  display_aspect_ratio: Schema.optional(Schema.String),

  bit_rate: Schema.optional(Schema.NumberFromString),
  nb_frames: Schema.optional(Schema.NumberFromString),

  r_frame_rate: Schema.optional(Schema.String),
  avg_frame_rate: Schema.String,

  color_space: Schema.optional(Schema.String),
  color_transfer: Schema.optional(Schema.String),
  color_primaries: Schema.optional(Schema.String),

  tags: Schema.optional(
    Schema.Struct({
      rotate: Schema.optional(Schema.NumberFromString),
    }),
  ),
  disposition: Schema.optional(
    Schema.Struct({
      default: Schema.optional(Schema.BooleanFromBit),
    }),
  ),
  side_data_list: Schema.optional(
    Schema.Array(
      Schema.Struct({
        rotation: Schema.optional(Schema.Number),
      }),
    ),
  ),
});

export const VideoMetadataVideoStreamSchema =
  VideoMetadataVideoStreamSchemaBase.pipe(
    Schema.decodeTo(
      Schema.toType(
        Schema.Struct({
          ...VideoMetadataVideoStreamSchemaBase.fields,
          fps: Schema.Number,
        }),
      ),
      {
        decode: SchemaGetter.transformEffect((value) => {
          const [num, den] = value.avg_frame_rate.split("/").map(Number);
          if (
            !num ||
            !den ||
            Number.isNaN(num) ||
            Number.isNaN(den) ||
            num <= 0 ||
            den <= 0
          ) {
            return Effect.fail(
              new SchemaIssue.InvalidValue({ message: "Invalid frame rate" }),
            );
          }
          return Effect.succeed({
            ...value,
            fps: num / den,
          });
        }),
        encode: SchemaGetter.transform((value) => value),
      },
    ),
  );

export const VideoMetadataAudioStreamSchema = Schema.Struct({
  index: Schema.Number,
  codec_type: Schema.Literal("audio"),
  codec_name: Schema.String,

  bit_rate: Schema.optional(Schema.NumberFromString),

  sample_rate: Schema.NumberFromString,
  channels: Schema.Finite.pipe(Schema.check(Schema.isGreaterThan(0))),
  channel_layout: Schema.String,
  disposition: Schema.optional(
    Schema.Struct({
      default: Schema.optional(Schema.BooleanFromBit),
    }),
  ),
});

export type VideoMetadataAudioStream = Schema.Schema.Type<
  typeof VideoMetadataAudioStreamSchema
>;

export const VideoMetadataValidated = Schema.Struct({
  videoStream: VideoMetadataVideoStreamSchema,
  audioStream: Schema.optional(VideoMetadataAudioStreamSchema),
  format: VideoMetadataFormatValidatedSchema,
});

export type VideoMetadataVideoStream = Schema.Schema.Type<
  typeof VideoMetadataVideoStreamSchema
>;
export type VideoMetadataValidated = Schema.Schema.Type<
  typeof VideoMetadataValidated
>;
