import { mainPlayer } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import { Maximize2, Minimize2 } from 'lucide-react';

export function VideoPlayerFullscreenButton() {
  const fullscreen = mainPlayer.usePlayerState((s) => s.display.fullscreen);
  const { toggleFullscreen } = mainPlayer.usePlayerApi('display');

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
