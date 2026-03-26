import { useVideoPlayerUiDesktop } from '@/lib/video-player/video-player-context';
import { Button } from '@repo/ui/components/button';
import { Slider } from '@repo/ui/components/slider';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

export function VideoPlayerVolume({
  muteButtonRef,
}: {
  muteButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const { controller } = useVideoPlayerUiDesktop();

  const [volume, setVolume] = useState(controller.volume);

  useEffect(() => {
    const handleVolumeChange = (newVolume: number) => {
      setVolume(newVolume);
    };

    controller.on('volumeChange', handleVolumeChange);

    return () => {
      controller.off('volumeChange', handleVolumeChange);
    };
  }, [controller]);

  return (
    <div className="group/volume flex flex-row items-center w-full rounded-full hover:bg-muted hover:text-foreground dark:hover:bg-muted/50">
      <Button
        variant="ghost"
        className="size-9 rounded-full group dark:hover:bg-transparent"
        onClick={() => controller.toggleMute()}
        ref={muteButtonRef}
      >
        <Volume1 className="size-6 group-data-[state=low]:block hidden" />
        <Volume2 className="size-6 group-data-[state=high]:block hidden" />
        <VolumeX className="size-6 group-data-[state=muted]:block hidden" />
      </Button>
      <div
        className="
        grid grid-cols-[0fr] opacity-0
        transition-[grid-template-columns,opacity] duration-300 ease-in-out
        group-hover/volume:grid-cols-[1fr] group-hover/volume:opacity-100
        group-focus-within/volume:grid-cols-[1fr] group-focus-within/volume:opacity-100
      "
      >
        <div className="overflow-hidden">
          <div className="w-20 h-9 flex items-center pl-1 pr-2">
            <Slider
              className="w-full"
              min={0}
              max={1}
              step={0.01}
              onPointerDown={controller.startSettingVolume}
              onKeyDown={controller.startSettingVolume}
              onValueChange={(v) =>
                controller.setVolume(Array.isArray(v) ? v[0] : v)
              }
              value={volume}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
