import { useVideoPlayerController } from '@/lib/video-player1/video-player-context';
import { Button } from '@repo/ui/components/button';
import { Maximize2, Minimize2 } from 'lucide-react';

export function VideoPlayerFullscreenButton({
  fullscreenButtonRef,
}: {
  fullscreenButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { toggleFullscreen } = useVideoPlayerController();

  return (
    <Button
      ref={fullscreenButtonRef}
      data-state="close"
      variant="ghost"
      className="size-9 rounded-full group"
      onClick={() => toggleFullscreen()}
    >
      <Minimize2 className="size-6 group-data-[state=close]:hidden" />
      <Maximize2 className="size-6 group-data-[state=open]:hidden" />
    </Button>
  );
}
