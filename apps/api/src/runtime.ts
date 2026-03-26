import { ChannelRepositoryLive } from "@repo/shared/services/channel/channel-repository";
import { DBClientLive } from "@repo/shared/services/db/db-client";
import { FileSystemLive } from "@repo/shared/services/file-system/file-system";
import { MediaValidatorLive } from "@repo/shared/services/media/media-validator";
import { MediaValidatorConfigLive } from "@repo/shared/services/media/media-validator-config";
import { VideoPublisherLive } from "@repo/shared/services/media/video-publisher";
import { VideoReposistoryLive } from "@repo/shared/services/media/video-repository";
import { QueueServiceLive } from "@repo/shared/services/queue/queue";
import { S3ClientLive } from "@repo/shared/services/s3/s3-client";
import { Layer, ManagedRuntime } from "effect";

const infraLayer = Layer.mergeAll(
  DBClientLive,
  S3ClientLive,
  QueueServiceLive,
  FileSystemLive,
);

const domainLayer = Layer.mergeAll(
  VideoReposistoryLive,
  ChannelRepositoryLive,
  MediaValidatorConfigLive,
);

const mediaValidatorLayer = Layer.provideMerge(MediaValidatorLive, domainLayer);

const appLayer = Layer.provideMerge(
  VideoPublisherLive,
  Layer.provideMerge(mediaValidatorLayer, infraLayer),
);

export const apiRuntime = ManagedRuntime.make(appLayer);
