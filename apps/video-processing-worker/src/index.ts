import { Container, getRandom } from "@cloudflare/containers";
import type { WSEvent } from "@repo/types/schemas/ws-events";
import { env } from "cloudflare:workers";
export { ContainerProxy } from "@cloudflare/containers";

export class VideoProcessingContainer extends Container {
  defaultPort = 8080; // The default port for the container to listen on
  sleepAfter = "6m"; // Sleep the container if no requests are made in this timeframe

  // default env vars to set in the container when starting
  envVars = {
    DATABASE_URL: env.DATABASE_URL,

    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT: env.R2_ENDPOINT,
    R2_REGION: env.R2_REGION,
  };

  // these lifecycle hooks are called whenever the container starts, stops, or errors
  override onStart() {
    console.log("Container successfully started");
  }

  override onStop() {
    console.log("Container successfully shut down");
  }

  override onError(error: unknown) {
    console.log("Container error:", error);
  }
}

VideoProcessingContainer.outboundByHost = {
  "ws.send": async (req, env, ctx) => {
    const { userId, message } = await req.json<{
      userId: string;
      message: WSEvent;
    }>();

    await env.WS.sendToUser(userId, message);
    return new Response();
  },
  "r2.put": async (req, env, ctx) => {
    const { pathname } = new URL(req.url);
    console.log("r2.put, pathname: ", pathname.substring(1));
    await env.VIDEOS.put(pathname, req.body);
    return new Response();
  },
  "r2.get": async (req, env, ctx) => {
    const { pathname } = new URL(req.url);
    console.log("r2.get, pathname: ", pathname);
    const response = await env.VIDEOS.get(pathname);
    if (!response) return new Response();
    return new Response(response.body, {
      headers: {
        "content-type":
          response.httpMetadata?.contentType || "application/octet-stream",
      },
    });
  },
};

type R2EventNotification = {
  account: string;
  action:
    | "PutObject"
    | "CopyObject"
    | "CompleteMultipartUpload"
    | "DeleteObject"
    | "LifecycleDeletion"
    | (string & {});
  bucket: string;
  object: {
    key: string;
    size: number;
    eTag: string;
  };
  eventTime: string;
  copySource?: {
    bucket: string;
    object: string;
  };
};

export default {
  async queue(
    batch: MessageBatch<R2EventNotification>,
    env: Env,
  ): Promise<void> {
    for (const message of batch.messages) {
      try {
        const container = await getRandom(env.VIDEO_PROCESSING_CONTAINER, 3);

        const key = message.body.object.key;
        console.log("KEY: ", key);
        const assetId = key.split("/")[1];
        console.log("ASSET ID: ", assetId);
        const response = await container.fetch(
          new Request("http://container/process", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              assetId: assetId,
            }),
          }),
        );

        if (!response.ok) {
          throw new Error(
            `Container returned ${response.status}: ${await response.text()}`,
          );
        }

        message.ack();
      } catch (error) {
        console.error("Video processing job failed", {
          error,
          messageId: message.id,
        });

        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Env, R2EventNotification>;
