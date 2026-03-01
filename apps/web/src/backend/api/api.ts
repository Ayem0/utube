import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { authPlugin } from './api-auth';
import { videoController } from './video/video-controller';

// API entrypoint
const api = new Elysia({
  prefix: '/api',
  adapter: CloudflareAdapter,
  aot: false,
})
  .use(cors())
  .use(authPlugin)
  .use(videoController);

export { api };
