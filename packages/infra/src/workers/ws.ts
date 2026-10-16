import type { RuntimeContext } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
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
