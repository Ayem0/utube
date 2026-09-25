import { usePlayerState } from '@/lib/video-player/create-player';
import { Button } from '@repo/ui/components/button';
import { timeFeature } from '@repo/video-player/feature/core/time';
import { useLayoutEffect, useRef, useState } from 'react';

export function VideoPlayerTimer() {
  const currentTimeStr = usePlayerState(timeFeature, (s) => s.currentTimeStr);
  const durationStr = usePlayerState(timeFeature, (s) => s.durationStr);
  const remainingTimeStr = usePlayerState(
    timeFeature,
    (s) => s.remainingTimeStr,
  );
  const [remainingMode, setRemainingMode] = useState(false);
  const timeRef = useRef<HTMLTimeElement>(null);

  useLayoutEffect(() => {
    if (!timeRef.current) return;
    timeRef.current.textContent = remainingMode
      ? remainingTimeStr
      : currentTimeStr;
  }, [currentTimeStr, remainingMode]);

  return (
    <Button
      variant="ghost"
      onClick={() => setRemainingMode((prev) => !prev)}
      className="text-sm text-nowrap leading-none rounded-full px-2 gap-1 flex items-center"
    >
      <time ref={timeRef}>--:--</time>
      <span>/</span>
      <time>{durationStr}</time>
    </Button>
  );
}
