import { usePlayerState } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import { useLayoutEffect, useRef, useState } from 'react';

export function VideoPlayerTimer() {
  const { currentTimeStr, durationStr, remainingTimeStr } =
    usePlayerState('time');
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
