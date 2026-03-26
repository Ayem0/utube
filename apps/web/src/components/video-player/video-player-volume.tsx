import { useVideoPlayerStates } from '@/hooks/use-video-state';
import { useVideoPlayerController } from '@/lib/video-player/video-player-context';
import { Button } from '@repo/ui/components/button';
import { Slider } from '@repo/ui/components/slider';
import { Volume1, Volume2, VolumeX } from 'lucide-react';

export function VideoPlayerVolume() {
  const { setVolume, toggleMute, startSettingVolume } =
    useVideoPlayerController();
  const { volume, muted } = useVideoPlayerStates((s) => ({
    volume: s.volume,
    muted: s.muted,
  }));

  return (
    <div className="group/volume flex flex-row items-center w-full">
      <Button
        variant="ghost"
        className="size-9 rounded-full"
        onClick={() => toggleMute()}
      >
        {muted ? (
          <VolumeX className="size-6" />
        ) : volume >= 0.5 ? (
          <Volume2 className="size-6" />
        ) : (
          <Volume1 className="size-6" />
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
          <div className="w-20 h-9 flex items-center px-1">
            <Slider
              className="w-full"
              min={0}
              max={1}
              step={0.01}
              onPointerDown={startSettingVolume}
              onKeyDown={startSettingVolume}
              onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)}
              value={volume}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
