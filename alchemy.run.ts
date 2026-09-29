import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import { UtubeApi } from "./apps/api/alchemy.run";
import { UtubeWeb, WebConfig } from "./apps/web/alchemy.run";

export default Alchemy.Stack(
  "utube",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const api = yield* UtubeApi;
    const web = yield* UtubeWeb.pipe(
      Effect.provideService(WebConfig, { apiUrl: api.url }),
    );
    return {
      apiUrl: api.url.as<string>(),
      webUrl: web.url.as<string>(),
    };
  }),
);
