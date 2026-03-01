import { DB, PgClientLive } from '@repo/shared/services/db/db-service';
import { MediaValidator } from '@repo/shared/services/media/media-validator';
import { VideoPublisher } from '@repo/shared/services/video/video-publisher';
import { VideoRepository } from '@repo/shared/services/video/video-repository';
import { env } from 'cloudflare:workers';
import { Effect } from 'effect';
import Elysia, { fileType } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { authPlugin } from '../api-auth';
import { videoUploadSchema } from './video';
import type { VideoUploadSchema } from './video';

const program = (body: VideoUploadSchema, userId: string) =>
  Effect.gen(function* () {
    const videoPublisher = yield* VideoPublisher;
    const res = yield* videoPublisher.publishVideo(
      userId,
      body.title,
      body.description,
      body.image,
      body.video,
    );
    yield* Effect.promise(() =>
      env.container_jobs.send({
        id: res[0].id,
        imageId: res[0].thumbnail,
        videoId: res[0].url,
      }),
    );

    return res;
  });

const videoController = new Elysia({
  adapter: CloudflareAdapter,
  aot: false,
})
  .use(authPlugin)
  .post(
    '/video',
    async ({ body, status, user }) => {
      return await Effect.runPromise(
        program(body, user.id).pipe(
          Effect.provide(VideoPublisher.Live),
          Effect.provide(VideoRepository.Live),
          Effect.provide(MediaValidator.Live),
          Effect.provide(UploadImage.Live),
          Effect.provide(UploadVideo.Live),
          Effect.provide(DB.Live),
          Effect.provide(PgClientLive),
          Effect.match({
            onSuccess: (res) => {
              return status(201, res);
            },
            onFailure: (e) => {
              console.log('ERROR', e);
              if (
                e._tag === 'InvalidMediaSizeError' ||
                e._tag === 'InvalidMediaTypeError'
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
          fileType(f, ['image/jpeg', 'image/png', 'image/webp']),
        ),
        video: videoUploadSchema.shape.video.refine((f) =>
          fileType(f, ['video/mp4', 'video/webm']),
        ),
      }),
      auth: true,
    },
  );

export { videoController };
