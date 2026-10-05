import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import { UtubeApi } from "./apps/api/alchemy.run";
import { UtubeWeb, WebConfig } from "./apps/web/alchemy.run";
import WSWorker from "./apps/ws/src/worker";

export default Alchemy.Stack(
  "utube",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const api = yield* UtubeApi;
    const ws = yield* WSWorker;
    const web = yield* UtubeWeb.pipe(
      Effect.provideService(WebConfig, { apiUrl: api.url, wsUrl: ws.url }),
    );
    return {
      apiUrl: api.url.as<string>(),
      webUrl: web.url.as<string>(),
      wsUrl: ws.url.as<string>(),
    };
  }),
);
