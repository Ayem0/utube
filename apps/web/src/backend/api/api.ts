import { Elysia } from 'elysia';
import { authPlugin } from './api-auth';
import { apiWs } from './api-ws';
import { channelController } from './channel/channel-controller';
import { studioController } from './studio/studio-controller';
import { videoController } from './video/video-controller';

// API entrypoint
const api = new Elysia({
  prefix: '/api',
})
  // .use(cors())
  .use(authPlugin)
  .use(videoController)
  .use(channelController)
  .use(studioController)
  .use(apiWs)
  .onError(({ error, status }) => {
    console.log('ERROR', error);
    return status(500, 'Internal server error');
  });

export { api };
