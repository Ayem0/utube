import { usePlayerApi, usePlayerState } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import { PictureInPicture, PictureInPicture2 } from 'lucide-react';

export function VideoPlayerPipButton() {
  const { togglePiP } = usePlayerApi('display');
  const isPip = usePlayerState('display', (s) => s.pip);

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
