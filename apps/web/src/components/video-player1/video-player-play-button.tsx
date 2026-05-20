import { useVideoPlayerController } from '@/lib/video-player1/video-player-context';
import { Button } from '@repo/ui/components/button';
import { Pause, Play, RotateCcw } from 'lucide-react';

export function VideoPlayerPlayButton({
  playButtonRef,
}: {
  playButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { togglePlay } = useVideoPlayerController();
  return (
    <Button
      data-state="paused"
      ref={playButtonRef}
      variant="ghost"
      className="size-9 rounded-full group"
      onClick={() => togglePlay()}
    >
      <RotateCcw className="size-6 group-data-[state=ended]:block hidden" />
      <Pause className="size-6 group-data-[state=playing]:block hidden" />
      <Play className="size-6 group-data-[state=paused]:block hidden" />
    </Button>
  );
}
