import { useVideoPlayerController } from '@/lib/video-player1/video-player-context';

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
