import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";

export default class WSServer extends Cloudflare.DurableObject<WSServer>()(
  "WSServer",
  Effect.gen(function* () {
    const state = yield* Cloudflare.DurableObjectState;

    return Effect.gen(function* () {
      return {
        fetch: Effect.gen(function* () {
          console.log("in the do");
          const [response, socket] = yield* Cloudflare.upgrade();
          console.log("it worked now returning the response!");
          console.log(response.status);
          return response;
        }),
        /**
         * RPC method to send message from server to clients
         * @param message Already JSON stringified @type {WSEvent}
         */
        sendMessage: (message: string) =>
          Effect.gen(function* () {
            const wss = yield* state.getWebSockets();

            yield* Effect.forEach(wss, (ws) => ws.send(message), {
              discard: true,
            });
          }),
        webSocketClose: Effect.fn(function* (
          ws: Cloudflare.WebSocket,
          code: number,
          reason: string,
        ) {
          console.log(code, reason);
          yield* ws.close(code, reason);
        }),
        webSocketError: Effect.fn(function* (
          ws: Cloudflare.WebSocket,
          error: unknown,
        ) {
          // Cloudflare closes an errored socket after this handler runs; only
          // the session bookkeeping is ours to clean up.
          console.log("WS Error: ", error);
        }),
      };
    });
  }),
) {}
