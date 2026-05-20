import { Context, Layer } from "effect";

export class VideoProcessorConfig extends Context.Tag("VideoProcessorConfig")<
  VideoProcessorConfig,
  VideoProcessorConfigService
>() {}

export interface VideoProcessorConfigService {
  readonly SEGMENT_DURATION_SECONDS: number;
}

export const VideoProcessorConfigLive = Layer.succeed(VideoProcessorConfig, {
  SEGMENT_DURATION_SECONDS: 4,
});
