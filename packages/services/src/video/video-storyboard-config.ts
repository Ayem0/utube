import { Context, Layer } from "effect";

export class VideoStoryboardConfig extends Context.Tag("VideoStoryboardConfig")<
  VideoStoryboardConfig,
  VideoStoryboardConfigService
>() {}

export interface VideoStoryboardConfigService {
  readonly SHORT_VIDEO_MAX_SECONDS: number;
  readonly MEDIUM_VIDEO_MAX_SECONDS: number;
  readonly LONG_VIDEO_MAX_SECONDS: number;
  readonly SHORT_VIDEO_STORYBOARD_INTERVAL_SECONDS: number;
  readonly MEDIUM_VIDEO_STORYBOARD_INTERVAL_SECONDS: number;
  readonly LONG_VIDEO_STORYBOARD_INTERVAL_SECONDS: number;
  readonly VERYLONG_VIDEO_STORYBOARD_INTERVAL_SECONDS: number;
  readonly STORYBOARD_WIDTH: number;
  readonly STORYBOARD_HEIGHT: number;
  readonly STORYBOARD_TILE_COLS: number;
  readonly STORYBOARD_TILE_ROWS: number;
}

export const VideoStoryboardConfigLive = Layer.succeed(VideoStoryboardConfig, {
  SHORT_VIDEO_MAX_SECONDS: 60,
  MEDIUM_VIDEO_MAX_SECONDS: 1200,
  LONG_VIDEO_MAX_SECONDS: 7200,
  SHORT_VIDEO_STORYBOARD_INTERVAL_SECONDS: 1,
  MEDIUM_VIDEO_STORYBOARD_INTERVAL_SECONDS: 2,
  LONG_VIDEO_STORYBOARD_INTERVAL_SECONDS: 5,
  VERYLONG_VIDEO_STORYBOARD_INTERVAL_SECONDS: 10,
  STORYBOARD_WIDTH: 160,
  STORYBOARD_HEIGHT: 90,
  STORYBOARD_TILE_COLS: 5,
  STORYBOARD_TILE_ROWS: 5,
});
