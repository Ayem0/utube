import { ChannelRepository } from "@repo/services/channel/channel-repository";
import { VideoRepository } from "@repo/services/video/video-repository";
import { VideoService } from "@repo/services/video/video-service";
import { Layer, ManagedRuntime } from "effect";

const appLayer = Layer.mergeAll(
  VideoService.Layer,
  VideoRepository.Layer,
  ChannelRepository.Layer,
);

export const apiRuntime = ManagedRuntime.make(appLayer);
