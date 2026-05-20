import { usePlayerApi } from '@/lib/video-player/player';

export function VideoPlayerOverlay() {
  const { toggleFullscreen } = usePlayerApi('display');
  const { togglePlay } = usePlayerApi('playback');
  return (
    <div
      className="absolute inset-0"
      onClick={() => togglePlay(true)}
      onDoubleClick={toggleFullscreen}
    />
  );
}
