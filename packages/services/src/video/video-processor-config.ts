import { Context, Layer } from "effect";

export interface VideoProcessorConfigService {
  readonly SEGMENT_DURATION_SECONDS: number;
}

export class VideoProcessorConfig extends Context.Service<
  VideoProcessorConfig,
  VideoProcessorConfigService
>()("VideoProcessorConfig") {
  static Layer = Layer.succeed(this, {
    SEGMENT_DURATION_SECONDS: 4,
  });
}
