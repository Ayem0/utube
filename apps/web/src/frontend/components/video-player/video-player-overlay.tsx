import { useVideoPlayerController } from '@/frontend/lib/video-player/video-player-context';

export function VideoPlayerOverlay() {
  const { togglePlay, toggleFullscreen } = useVideoPlayerController();
  return (
    <div
      className="absolute inset-0 bg-transparent"
      onClick={() => togglePlay()}
      onDoubleClick={() => toggleFullscreen()}
    ></div>
  );
}
