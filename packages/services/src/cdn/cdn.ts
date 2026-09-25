import { Context, Effect, Layer } from "effect";
import { CDNConfig } from "./cdn-config";

export interface CDNApi {
  getBaseUrl: () => Effect.Effect<string>;
}

export class CDN extends Context.Service<CDN, CDNApi>()("CDN", {
  make: Effect.gen(function* () {
    const cfg = yield* CDNConfig;
    return {
      getBaseUrl: () => Effect.succeed(cfg.baseUrl),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make);
}
