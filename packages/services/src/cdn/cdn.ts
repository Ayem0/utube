import { Context, Effect, Layer } from "effect";

export class CDNConfig extends Context.Service<
  CDNConfig,
  {
    readonly baseUrl: string;
  }
>()("CDNConfig") {}

export interface CDNApi {
  getBaseUrl: Effect.Effect<string>;
}

export class CDN extends Context.Service<CDN, CDNApi>()("CDN", {
  make: Effect.gen(function* () {
    const cfg = yield* CDNConfig;
    return {
      getBaseUrl: Effect.succeed(cfg.baseUrl),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make);
}
