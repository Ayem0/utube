import { usePlayerApi, usePlayerState } from '@/lib/video-player/create-player';
import { Button } from '@repo/ui/components/button';
import { displayFeature } from '@repo/video-player/feature/core/display';
import { PictureInPicture, PictureInPicture2 } from 'lucide-react';

export function VideoPlayerPipButton() {
  const { togglePiP } = usePlayerApi(displayFeature);
  const isPip = usePlayerState(displayFeature, (s) => s.pip);

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
