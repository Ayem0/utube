import { mainPlayer } from '@/lib/video-player/player';

export function VideoPlayerOverlay() {
  const { toggleFullscreen } = mainPlayer.usePlayerApi('display');
  const { togglePlay } = mainPlayer.usePlayerApi('playback');
  return (
    <div
      className="absolute inset-0"
      onClick={() => togglePlay(true)}
      onDoubleClick={toggleFullscreen}
    />
  );
}
