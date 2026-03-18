import {
  ChannelRepository,
  ChannelRepositoryLive,
} from '@repo/shared/services/channel/channel-repository';
import { DBClientLive } from '@repo/shared/services/db/db-client';
import { Effect, Layer, ManagedRuntime } from 'effect';
import Elysia from 'elysia';
import { authPlugin } from '../api-auth';

export const studioController = new Elysia().use(authPlugin).get(
  '/studio/channel/:channelId',
  async ({ user, status, params }) => {
    return await runtime.runPromise(
      getChannelsByUserId(user.id, params.channelId).pipe(
        Effect.match({
          onSuccess: (res) => {
            return status(200, res);
          },
          onFailure: (e) => {
            console.log('ERROR', e);
            return status(500);
          },
        }),
      ),
    );
  },
  {
    auth: true,
  },
);

const layer = ChannelRepositoryLive.pipe(Layer.provide(DBClientLive));
const runtime = ManagedRuntime.make(layer);
const getChannelsByUserId = (userId: string, channelId: string) =>
  Effect.gen(function* () {
    const repo = yield* ChannelRepository;
    return yield* repo.getStudioChannelById(channelId, userId);
  });
