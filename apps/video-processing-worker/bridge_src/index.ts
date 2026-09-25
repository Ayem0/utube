
type MinioNotification = {
  Records: Array<{
    eventName: string;
    eventTime: string;

    s3: {
      bucket: {
        name: string;
      };

      object: {
        key: string;
        size: number;
        eTag: string;
      };
    };
  }>;
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
  async fetch(request: Request, env: MinioBridgeEnv) {
    const url = new URL(request.url);

    if (request.method !== "POST" || url.pathname !== "/__dev/minio-event") {
      return new Response("Not found", { status: 404 });
    }

    const payload = await request.json<MinioNotification>();

    console.log("MinIO event:", JSON.stringify(payload));

    for (const record of payload.Records) {
      const r2Event: R2EventNotification = {
        account: "local",
        action: "PutObject",
        bucket: record.s3.bucket.name,
        object: {
          ...record.s3.object,
          key: decodeURIComponent(record.s3.object.key.replace(/\+/g, " ")),
        },
        eventTime: record.eventTime,
      };
      const res = await env.VIDEO_PROCESSING_QUEUE.send(r2Event);
      console.log("Publish response: ", res);
    }

    return new Response(null, { status: 204 });
  },
} satisfies ExportedHandler<MinioBridgeEnv>;
