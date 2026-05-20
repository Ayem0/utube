import { usePlayerApi, usePlayerState } from '@/lib/video-player/player';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Gauge } from 'lucide-react';

export function VideoPlayerPlayrate() {
  const { playbackRate } = usePlayerState('playback');
  const { setPlaybackRate } = usePlayerApi('playback');
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Gauge className="mr-2 size-6" />
        <div className="flex w-full justify-between items-center">
          <span>Playback Rate</span>
          <span className="text-nowrap">
            {playbackRate === 1 ? 'Default' : `${playbackRate}x`}
          </span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuLabel>Playback Rate</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={playbackRate}
          onValueChange={(v: number) => setPlaybackRate(v)}
        >
          <DropdownMenuRadioItem value={0.25}>0.25x</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={0.5}>0.50x</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={0.75}>0.75x</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={1}>1.00x</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={1.25}>1.25x</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={1.5}>1.50x</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={1.75}>1.75x</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={2}>2.00x</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
