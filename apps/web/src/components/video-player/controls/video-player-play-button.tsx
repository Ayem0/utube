import { usePlayerApi, usePlayerState } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';

export function VideoPlayerPlayButton() {
  const { togglePlay } = usePlayerApi('playback');
  const { ended, paused } = usePlayerState('playback');
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
