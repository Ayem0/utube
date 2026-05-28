import { player } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import { Slider } from '@repo/ui/components/slider';
import { useDebouncedCallback } from '@tanstack/react-pacer';
import { Volume1, Volume2, VolumeX } from 'lucide-react';

export function VideoPlayerVolume() {
  const muted = player.usePlayerState((s) => s.volume.muted);
  const volume = player.usePlayerState((s) => s.volume.volume);
  const { setMuted, setVolume, setLastVolume } = player.usePlayerApi('volume');
  const { setActive, setInactive } = player.usePlayerApi('interaction');
  const debouncedAutoHide = useDebouncedCallback(setInactive, {
    wait: 1500,
  });
  const onInteract = (fn: () => void) => {
    setActive();
    fn();
    debouncedAutoHide();
  };

  return (
    <div className="group/volume flex flex-row items-center w-full rounded-full hover:bg-muted hover:text-foreground dark:hover:bg-muted/50">
      <Button
        variant="ghost"
        className="size-9 rounded-full dark:hover:bg-transparent"
        onClick={() => setMuted(!muted)}
      >
        {muted ? (
          <VolumeX className="size-6" />
        ) : volume < 0.5 ? (
          <Volume1 className="size-6" />
        ) : (
          <Volume2 className="size-6" />
        )}
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
              onPointerDown={() => onInteract(setLastVolume)}
              onKeyDown={() => onInteract(setLastVolume)}
              onValueChange={(v) =>
                onInteract(() => setVolume(Array.isArray(v) ? v[0] : v))
              }
              value={[muted ? 0 : volume]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
