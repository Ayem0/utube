import * as Cloudflare from 'alchemy/Cloudflare';
import { Context, Effect } from 'effect';
import { UtubeApi } from '../api/alchemy.run';
import WSWorker from '../ws/src/worker';

type ApiUrl = Effect.Success<typeof UtubeApi>['url'];
type WsUrl = Effect.Success<typeof WSWorker>['url'];

export class WebConfig extends Context.Service<
  WebConfig,
  {
    apiUrl: ApiUrl;
    wsUrl: WsUrl;
  }
>()('WebConfig') {}

export const UtubeWeb = Effect.gen(function* () {
  const config = yield* WebConfig;

  return yield* Cloudflare.Website.Vite('utube-web', {
    rootDir: './apps/web',
    env: {
      VITE_API_URL: config.apiUrl.as<string>(),
      VITE_WS_URL: config.wsUrl.as<string>(),
    },
    dev: {
      port: 3000,
    },
    compatibility: { flags: ['nodejs_compat'], date: '2026-09-25' },
  });
});

export type UtubeWebEnv = Cloudflare.InferEnv<typeof UtubeWeb>;
