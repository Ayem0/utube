import type { WSEvent } from "@repo/types/schemas/ws-events";
import { Context, Data, Effect } from "effect";

export class WSMessageError extends Data.TaggedError("WSMessageError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export interface WSService {
  send: (
    userId: string,
    message: WSEvent,
  ) => Effect.Effect<void, never>;
}

export class WS extends Context.Service<WS, WSService>()("WS") {}
