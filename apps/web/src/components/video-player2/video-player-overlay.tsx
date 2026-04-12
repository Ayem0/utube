import { useVideoPlayerUiDesktop } from '@/components/providers/video-player-provider';

export function VideoPlayerOverlay() {
  const UI = useVideoPlayerUiDesktop();
  return (
    <div
      className="absolute inset-0 bg-transparent"
      onClick={() => {
        UI.togglePlay();
      }}
      onDoubleClick={() => UI.toggleFullscreen()}
    ></div>
  );
}
