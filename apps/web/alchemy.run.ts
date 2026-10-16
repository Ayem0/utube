import { WSWorker } from '@repo/infra/ws';
import * as Cloudflare from 'alchemy/Cloudflare';
import { Effect } from 'effect';
import { Api } from '../api/alchemy.run';

export const Web = Cloudflare.Website.Vite(
  'Web',
  Effect.gen(function* () {
    const api = yield* Api;
    const ws = yield* WSWorker;
    return {
      rootDir: './apps/web',
      env: {
        VITE_API_URL: api.url.as<string>(),
        VITE_WS_URL: ws.url.as<string>(),
      },
      dev: {
        port: 3000,
      },
      compatibility: { flags: ['nodejs_compat'], date: '2026-09-25' },
    };
  }),
);
