import { mainPlayer } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import { PictureInPicture, PictureInPicture2 } from 'lucide-react';

export function VideoPlayerPipButton() {
  const { togglePiP } = mainPlayer.usePlayerApi('display');
  const isPip = mainPlayer.usePlayerState((s) => s.display.pip);

  return (
    <Button
      className="size-9 rounded-full"
      variant="ghost"
      onClick={() => togglePiP()}
    >
      {isPip ? (
        <PictureInPicture className="size-6" />
      ) : (
        <PictureInPicture2 className="size-6" />
      )}
    </Button>
  );
}
