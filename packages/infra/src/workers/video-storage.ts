import * as Cloudflare from "alchemy/Cloudflare";

export class VideoStorageGatewayWorker extends Cloudflare.Worker<
  VideoStorageGatewayWorker,
  {}
>()("VideoStorageGatewayWorker") {}

export class VideoStorageCacheWorker extends Cloudflare.Worker<
  VideoStorageCacheWorker,
  {}
>()("VideoStorageCacheWorker") {}
