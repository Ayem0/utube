import { makeAuth } from "@repo/auth/auth";
import { makeDb } from "@repo/db";
import type { WSEvent } from "@repo/types/schemas/ws-events";
import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";

// Worker
export default class WS extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Only /ws is a WebSocket endpoint.
    if (url.pathname !== "/ws") {
      return new Response("Not found", {
        status: 404,
      });
    }

    // Require WebSocket upgrade.
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Worker expected Upgrade: websocket", {
        status: 426,
      });
    }

    const auth = makeAuth(
      makeDb(this.env.HYPERDRIVE.connectionString),
      this.env.BETTER_AUTH_URL,
      this.env.BETTER_AUTH_SECRET,
    );

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session)
      return new Response("Unauthorized", {
        status: 401,
      });

    const obj = this.env.WEBSOCKET_SERVER.getByName(session.user.id);

    return obj.fetch(request);
  }

  async sendToUser(userId: string, message: WSEvent): Promise<number> {
    const obj = this.env.WEBSOCKET_SERVER.getByName(userId);
    return obj.sendMessage(JSON.stringify(message));
  }
}

// DO
export class WebsocketServer extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // this.ctx.setWebSocketAutoResponse(
    //   new WebSocketRequestResponsePair("ping", "pong"),
    // );
  }

  /**
   * Accept a new WebSocket connection.
   */
  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    if (!server) throw new Error("WebSocket server not found");

    this.ctx.acceptWebSocket(server);

    const id = crypto.randomUUID();

    server.serializeAttachment({ id });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * RPC method used by the ws-gateway to send message from server to clients
   * @param message Already JSON stringified @type {WSEvent}
   * @returns the number of messages successfully sent to clients
   */
  async sendMessage(message: string): Promise<number> {
    let sent = 0;

    console.log("sending msg to ws", message);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(message);
        sent++;
      } catch (error) {
        // If the ws closed between loop iteration and send call
        console.error("Failed to send message to websocket:", error);
        continue;
      }
    }
    return sent;
  }

  webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): void {
    console.log("SERVER webSocketClose", {
      time: Date.now(),
      readyState: ws.readyState,
      code,
      reason,
      wasClean,
    });
    // not required but in wrangler dev it is
    ws.close();
  }

  /**
   * Called if Cloudflare encounters a WebSocket error.
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);

    try {
      ws.close(1011, "WebSocket server error");
    } catch {
      // Socket may already be closed.
    }
  }
}
