import { usePlayerApi, usePlayerState } from '@/lib/video-player/create-player';
import { Button } from '@repo/ui/components/button';
import { playbackFeature } from '@repo/video-player/feature/core/playback';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';

export function VideoPlayerPlayButton() {
  const { togglePlay } = usePlayerApi(playbackFeature);
  const ended = usePlayerState(playbackFeature, (s) => s.ended);
  const paused = usePlayerState(playbackFeature, (s) => s.paused);
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
