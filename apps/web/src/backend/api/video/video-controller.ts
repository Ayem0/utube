import { DBClientLive } from '@repo/shared/services/db/db-client';
import { MediaValidator } from '@repo/shared/services/media/media-validator';
import { QueueServiceLive } from '@repo/shared/services/queue/queue';
import { S3ClientLive } from '@repo/shared/services/s3/s3-client';
import { VideoPublisher } from '@repo/shared/services/video/video-publisher';
import { VideoRepository } from '@repo/shared/services/video/video-repository';
import { Effect } from 'effect';
import Elysia, { fileType } from 'elysia';
import { authPlugin } from '../api-auth';
import type { VideoUploadSchema } from './video';
import { videoUploadSchema } from './video';

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
    return res;
  });

const videoController = new Elysia().use(authPlugin).post(
  '/video',
  async ({ body, status, user }) => {
    return await Effect.runPromise(
      program(body, user.id).pipe(
        Effect.provide(VideoPublisher.Live),
        Effect.provide(VideoRepository.Live),
        Effect.provide(MediaValidator.Live),
        Effect.provide(S3ClientLive),
        Effect.provide(DBClientLive),
        Effect.provide(QueueServiceLive),
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
