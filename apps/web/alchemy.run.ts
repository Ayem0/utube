import * as Cloudflare from 'alchemy/Cloudflare';
import { Context, Effect } from 'effect';
import { UtubeApi } from '../api/alchemy.run';

type ApiUrl = Effect.Success<typeof UtubeApi>['url'];

export class WebConfig extends Context.Service<
  WebConfig,
  {
    apiUrl: ApiUrl;
  }
>()('WebConfig') {}

export const UtubeWeb = Effect.gen(function* () {
  const config = yield* WebConfig;

  return yield* Cloudflare.Website.Vite('utube-web', {
    rootDir: './apps/web',
    env: {
      VITE_API_URL: config.apiUrl.as<string>(),
    },
    dev: {
      port: 3000,
    },
  });
});

export type UtubeWebEnv = Cloudflare.InferEnv<typeof UtubeWeb>;
