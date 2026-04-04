import { ChannelRepositoryLive } from "@repo/services/channel/channel-repository";
import { DBClientLive } from "@repo/services/db/db-client";
import { FileSystemLive } from "@repo/services/file-system/file-system";
import { MediaValidatorConfigLive } from "@repo/services/media/media-validator-config";
import { QueueClientLive } from "@repo/services/queue/queue-client";
import { S3ClientLive } from "@repo/services/s3/s3-client";
import { VideoPublisherLive } from "@repo/services/video/video-publisher";
import { VideoReposistoryLive } from "@repo/services/video/video-repository";
import { VideoValidatorLive } from "@repo/services/video/video-validator";
import { Layer, ManagedRuntime } from "effect";

const infraLayer = Layer.mergeAll(
  DBClientLive,
  S3ClientLive,
  QueueClientLive,
  FileSystemLive,
);

const domainLayer = Layer.mergeAll(
  VideoReposistoryLive,
  ChannelRepositoryLive,
  MediaValidatorConfigLive,
);

const mediaValidatorLayer = Layer.provideMerge(VideoValidatorLive, domainLayer);

const appLayer = Layer.provideMerge(
  VideoPublisherLive,
  Layer.provideMerge(mediaValidatorLayer, infraLayer),
);

export const apiRuntime = ManagedRuntime.make(appLayer);
