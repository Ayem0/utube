import { usePlayerApi, usePlayerState } from '@/lib/video-player/create-player';
import { Button } from '@repo/ui/components/button';
import { displayFeature } from '@repo/video-player/feature/core/display';
import { Maximize2, Minimize2 } from 'lucide-react';

export function VideoPlayerFullscreenButton() {
  const fullscreen = usePlayerState(displayFeature, (s) => s.fullscreen);
  const { toggleFullscreen } = usePlayerApi(displayFeature);

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
