import { Elysia } from 'elysia';
import { authPlugin } from './api-auth';
import { videoController } from './video/video-controller';

// API entrypoint
const api = new Elysia({
  prefix: '/api',
})
  // .use(cors())
  .use(authPlugin)
  .use(videoController)
  .onError(({ error, status }) => {
    console.log('ERROR', error);
    return status(500, 'Internal server error');
  });

export { api };
