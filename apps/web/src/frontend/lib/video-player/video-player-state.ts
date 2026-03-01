export interface VideoPlayerControllerState {
  volume: number;
  muted: boolean;
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  isFullscreen: boolean;
  previewTime: number | null;
}
