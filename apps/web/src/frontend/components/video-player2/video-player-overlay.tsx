import { useVideoPlayerUiDesktop } from '@/frontend/lib/video-player/video-player-context';

export function VideoPlayerOverlay() {
  const { controller, UI } = useVideoPlayerUiDesktop();
  return (
    <div
      className="absolute inset-0 bg-transparent"
      onClick={() => {
        controller.togglePlay();
      }}
      onDoubleClick={() => UI.toggleFullscreen()}
    ></div>
  );
}
