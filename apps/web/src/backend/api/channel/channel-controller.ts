import {
  ChannelRepository,
  ChannelRepositoryLive,
} from '@repo/shared/services/channel/channel-repository';
import { DBClientLive } from '@repo/shared/services/db/db-client';
import { Effect, Layer, ManagedRuntime } from 'effect';
import Elysia from 'elysia';
import { authPlugin } from '../api-auth';
import { channelMacro } from './channel-macro';

export const channelController = new Elysia()
  .use(authPlugin)
  .use(channelMacro)
  .get(
    '/channel',
    async ({ user, status, selectedChannelId }) => {
      return await runtime.runPromise(
        getChannelsByUserId(user.id, selectedChannelId).pipe(
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
      channel: true,
      auth: true,
    },
  );

const layer = ChannelRepositoryLive.pipe(Layer.provide(DBClientLive));
const runtime = ManagedRuntime.make(layer);
const getChannelsByUserId = (userId: string, selectedChannelId?: string) =>
  Effect.gen(function* () {
    const repo = yield* ChannelRepository;
    return yield* repo.getChannelsByUserId(userId, selectedChannelId);
  });
