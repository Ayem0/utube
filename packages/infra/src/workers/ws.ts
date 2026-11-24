import * as Cloudflare from "@alchemy.run/cloudflare";
import type { RuntimeContext } from "alchemy";
import type { Effect } from "effect";

export class WSDO extends Cloudflare.DurableObject<
  WSDO,
  {
    sendMessage: (
      message: string,
    ) => Effect.Effect<void, never, RuntimeContext>;
  }
>()("WSServer") {}

export class WSWorker extends Cloudflare.Worker<WSWorker, {}, WSDO>()(
  "WSWorker",
) {}
