import { DBClientLive } from '@repo/shared/services/db/db-client';
import { FileSystemLive } from '@repo/shared/services/file-system/file-system';
import { MediaValidatorLive } from '@repo/shared/services/media/media-validator';
import { MediaValidatorConfigLive } from '@repo/shared/services/media/media-validator-config';
import { QueueServiceLive } from '@repo/shared/services/queue/queue';
import { S3ClientLive } from '@repo/shared/services/s3/s3-client';
import {
  VideoPublisher,
  VideoPublisherLive,
} from '@repo/shared/services/video/video-publisher';
import { VideoReposistoryLive } from '@repo/shared/services/video/video-repository';
import { Effect, Layer, ManagedRuntime } from 'effect';
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

const layer = VideoPublisherLive.pipe(
  Layer.provide(MediaValidatorLive),
  Layer.provide(MediaValidatorConfigLive),
  Layer.provide(VideoReposistoryLive),
  Layer.provide(DBClientLive),
  Layer.provide(S3ClientLive),
  Layer.provide(FileSystemLive),
  Layer.provide(QueueServiceLive),
);
const runtime = ManagedRuntime.make(layer);

const videoController = new Elysia().use(authPlugin).post(
  '/video',
  async ({ body, status, user }) => {
    return await runtime.runPromise(
      program(body, user.id).pipe(
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
