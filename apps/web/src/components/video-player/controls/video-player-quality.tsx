import { mainPlayer } from '@/lib/video-player/player';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@repo/ui/components/dropdown-menu';
import { VideoQuality } from '@repo/video-player/types';
import { SlidersHorizontal } from 'lucide-react';

export function VideoPlayerQuality() {
  const { currentQuality, qualities, isAuto } = mainPlayer.usePlayerState(
    (s) => s.quality,
  );
  const { setQuality } = mainPlayer.usePlayerApi('quality');
  if (!currentQuality) return null;
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <SlidersHorizontal className="mr-2 size-6" />
        <div className="flex w-full justify-between items-center">
          <span>Quality</span>
          <span className="text-nowrap">
            {isAuto
              ? `Auto (${renderQualityText(currentQuality)})`
              : renderQualityText(currentQuality)}
          </span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuLabel>Quality</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={isAuto ? -1 : currentQuality.index}
          onValueChange={(v: number) => setQuality(v)}
        >
          {qualities.map((quality) => (
            <DropdownMenuRadioItem key={quality.index} value={quality.index}>
              {renderQualityText(quality)}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem value={-1}>Auto</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function renderQualityText(quality: VideoQuality) {
  const fr = quality.frameRate === 60;
  return fr ? quality.height + 'p60' : quality.height + 'p';
}
