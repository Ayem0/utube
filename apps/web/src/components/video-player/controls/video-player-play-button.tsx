import { mainPlayer } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';

export function VideoPlayerPlayButton() {
  const { togglePlay } = mainPlayer.usePlayerApi('playback');
  const ended = mainPlayer.usePlayerState((s) => s.playback.ended);
  const paused = mainPlayer.usePlayerState((s) => s.playback.paused);
  const Icon = useMemo(() => {
    if (ended) return RotateCcw;
    if (paused) return Play;
    return Pause;
  }, [ended, paused]);
  return (
    <Button
      variant="ghost"
      className="size-9 rounded-full"
      onClick={() => togglePlay()}
    >
      <Icon className="size-6" />
    </Button>
  );
}
