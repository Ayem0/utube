import { usePlayerApi, usePlayerState } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import { Maximize2, Minimize2 } from 'lucide-react';

export function VideoPlayerFullscreenButton() {
  const fullscreen = usePlayerState('display', (s) => s.fullscreen);
  const { toggleFullscreen } = usePlayerApi('display');

  return (
    <Button
      variant="ghost"
      className="size-9 rounded-full"
      onClick={toggleFullscreen}
    >
      {fullscreen ? (
        <Minimize2 className="size-6" />
      ) : (
        <Maximize2 className="size-6" />
      )}
    </Button>
  );
}
