import type { VideoPlayerVolumeState } from '@/lib/video-player-volume';
import { setSessionVolumeState } from '@/lib/video-player-volume';
import { Button } from '@repo/ui/components/button';
import { Slider } from '@repo/ui/components/slider';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import type { RefObject } from 'react';
import { useEffect, useRef, useState, useTransition } from 'react';

export function VideoPlayerVolume({
  videoRef,
  initialVolume,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  initialVolume: VideoPlayerVolumeState;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [_, startTransition] = useTransition();
  const lastVolume = useRef(initialVolume.volume);
  const [value, setValue] = useState(initialVolume.volume);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const onVolumeChange = () => {
      startTransition(() => {
        container.dataset.state = getVolumeState(video.volume, video.muted);
        setValue(video.muted ? 0 : video.volume);
        setSessionVolumeState({ volume: video.volume, muted: video.muted });
      });
    };

    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  const onMuteClick = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };

  const onPointerDown = () => {
    if (value > 0) {
      lastVolume.current = value;
    }
  };

  const onValueChange = (v: number | ReadonlyArray<number>) => {
    const video = videoRef.current;
    if (!video) return;

    const value = Array.isArray(v) ? v[0] : v;
    if (value === 0) {
      video.volume = lastVolume.current;
      video.muted = true;
    } else {
      video.volume = value;
      video.muted = false;
    }
  };

  return (
    <div
      className="group/volume flex flex-row gap-2 items-center w-32"
      ref={containerRef}
      data-state={getVolumeState(initialVolume.volume, initialVolume.muted)}
    >
      <Button
        variant="ghost"
        className="size-9 rounded-full"
        onClick={onMuteClick}
      >
        <Volume1 className="size-6 group-data-[state=low]/volume:block hidden" />
        <Volume2 className="size-6 group-data-[state=high]/volume:block hidden" />
        <VolumeX className="size-6 group-data-[state=muted]/volume:block hidden" />
      </Button>
      <Slider
        className="w-full group-hover/volume:visible group-focus-within/volume:visible"
        min={0}
        max={1}
        step={0.01}
        onPointerDown={onPointerDown}
        onKeyDown={onPointerDown}
        onValueChange={onValueChange}
        value={value}
      />
    </div>
  );
}

function getVolumeState(volume: number, muted: boolean) {
  if (muted || volume === 0) return 'muted';
  return volume >= 0.5 ? 'high' : 'low';
}
