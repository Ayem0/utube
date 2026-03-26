import { Button } from '@repo/ui/components/button';
import { Pause, Play, RotateCcw } from 'lucide-react';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

export function VideoPlayerPlayButton({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    const button = buttonRef.current;
    if (!video || !button) return;

    const onPlay = () => {
      button.dataset.state = 'playing';
    };

    const onPause = () => {
      button.dataset.state = 'paused';
    };

    const onEnd = () => {
      button.dataset.state = 'ended';
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnd);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnd);
    };
  }, []);

  return (
    <Button
      data-state="paused"
      variant="ghost"
      ref={buttonRef}
      className="size-9 rounded-full group"
      onClick={() =>
        videoRef.current?.paused
          ? videoRef.current?.play()
          : videoRef.current?.pause()
      }
    >
      <RotateCcw className="size-6 group-data-[state=ended]:block hidden" />
      <Pause className="size-6 group-data-[state=playing]:block hidden" />
      <Play className="size-6 group-data-[state=paused]:block hidden" />
    </Button>
  );
}
