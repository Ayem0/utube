import { makeAuth } from "@repo/auth/auth";
import { makeDb } from "@repo/db";
import * as Cloudflare from "alchemy/Cloudflare";
import { Config, Effect, Redacted } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { Hyperdrive } from "../../../infra/cloudflare/hyperdrive";
import WSServer from "./do";

export default class WSWorker extends Cloudflare.Worker<WSWorker>()(
  "WSWorker",
  {
    main: import.meta.url,
    compatibility: { flags: ["nodejs_compat"] },
    dev: { port: 3002 },
  },
  Effect.gen(function* () {
    const wsServer = yield* WSServer;
    const hd = yield* Cloudflare.Hyperdrive.Connect(Hyperdrive);
    const baseUrl = yield* Config.String("BETTER_AUTH_URL");
    const secret = yield* Config.Redacted("BETTER_AUTH_SECRET");

    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;

        console.log("WS request", {
          url: request.url,
          upgrade: request.headers.upgrade,
          origin: request.headers.origin,
          hasCookie: Boolean(request.headers.cookie),
          cookieNames: request.headers.cookie
            ?.split(";")
            .map((cookie) => cookie.trim().split("=")[0]),
        });

        if (request.url !== "/ws" || request.headers.upgrade !== "websocket") {
          return HttpServerResponse.text("Expected Upgrade: websocket", {
            status: 426,
          });
        }

        const connectionString = Redacted.value(yield* hd.connectionString);
        const auth = makeAuth(
          makeDb(connectionString),
          baseUrl,
          Redacted.value(secret),
          [],
        );

        const session = yield* Effect.tryPromise(() =>
          auth.api.getSession({ headers: request.headers }),
        ).pipe(Effect.catch((e) => Effect.succeed(null)));

        if (!session) {
          console.log("Unauthorized");
          return HttpServerResponse.text("Unauthorized", { status: 401 });
        }

        console.log("forwarding request to do");
        return yield* wsServer.getByName(session.user.id).fetch(request);
      }),
    };
  }).pipe(Effect.provide(Cloudflare.Hyperdrive.ConnectBinding)),
) {}
