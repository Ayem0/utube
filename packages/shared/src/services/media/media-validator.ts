import { Context, Effect, Layer } from 'effect';
import { InvalidMediaSizeError, InvalidMediaTypeError } from './media-errors';

export class MediaValidator extends Context.Tag('MediaValidator')<
  MediaValidator,
  MediaValidator.Service
>() {}

const ALLOWED_IMAGE_TYPES: string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

const MAX_IMAGE_SIZE = 5_000_000 as const;

export namespace MediaValidator {
  export const makeLive = () => ({
    validateImage: (image: File) =>
      Effect.gen(function* () {
        if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
          return yield* Effect.fail(
            new InvalidMediaTypeError({ message: 'Invalid media type' }),
          );
        }
        if (image.size > MAX_IMAGE_SIZE) {
          return yield* Effect.fail(
            new InvalidMediaSizeError({ message: 'Invalid media size' }),
          );
        }
      }),
  });
  export type Service = ReturnType<typeof makeLive>;

  export const Live = Layer.succeed(MediaValidator, MediaValidator.makeLive());
}
