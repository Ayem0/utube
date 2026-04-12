import { useVideoPlayerUiDesktop } from '@/components/providers/video-player-provider';
import { Button } from '@repo/ui/components/button';
import {
  DrillDownMenu,
  DrillDownMenuBack,
  DrillDownMenuContent,
  DrillDownMenuGroup,
  DrillDownMenuItem,
  DrillDownMenuSub,
  DrillDownMenuSubContent,
  DrillDownMenuSubTrigger,
  DrillDownMenuTrigger,
} from '@repo/ui/components/drilldown-menu';
import { Gauge, Settings, SlidersHorizontal } from 'lucide-react';
import { RefObject } from 'react';

export function VideoPlayerSettings({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const UI = useVideoPlayerUiDesktop();

  return (
    <DrillDownMenu
      onOpenChangeComplete={(open) => {
        if (open) {
          UI.openMenu();
        } else {
          UI.closeMenu();
        }
      }}
    >
      <DrillDownMenuTrigger
        render={
          <Button variant="ghost" className="rounded-full size-9">
            <Settings className="size-6" />
          </Button>
        }
      />
      <DrillDownMenuContent
        side="top"
        align="center"
        sideOffset={15}
        container={containerRef}
      >
        <DrillDownMenuGroup>
          <DrillDownMenuSub>
            <DrillDownMenuSubTrigger>
              <Gauge className="mr-2 h-4 w-4" />
              <span>Playrate</span>
            </DrillDownMenuSubTrigger>
            <DrillDownMenuSubContent>
              <DrillDownMenuBack>Playrate</DrillDownMenuBack>
              <DrillDownMenuItem>0.25</DrillDownMenuItem>
              <DrillDownMenuItem>0.5</DrillDownMenuItem>
              <DrillDownMenuItem>0.75</DrillDownMenuItem>
              <DrillDownMenuItem>Normal</DrillDownMenuItem>
              <DrillDownMenuItem>1.25</DrillDownMenuItem>
              <DrillDownMenuItem>1.5</DrillDownMenuItem>
              <DrillDownMenuItem>1.75</DrillDownMenuItem>
              <DrillDownMenuItem>2</DrillDownMenuItem>
            </DrillDownMenuSubContent>
          </DrillDownMenuSub>
          <DrillDownMenuSub>
            <DrillDownMenuSubTrigger>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <span>Quality</span>
            </DrillDownMenuSubTrigger>
            <DrillDownMenuSubContent>
              <DrillDownMenuBack>Quality</DrillDownMenuBack>
              <DrillDownMenuItem>2160p</DrillDownMenuItem>
              <DrillDownMenuItem>1440p</DrillDownMenuItem>
              <DrillDownMenuItem>1080p</DrillDownMenuItem>
              <DrillDownMenuItem>720p</DrillDownMenuItem>
              <DrillDownMenuItem>480p</DrillDownMenuItem>
              <DrillDownMenuItem>360p</DrillDownMenuItem>
              <DrillDownMenuItem>240p</DrillDownMenuItem>
              <DrillDownMenuItem>144p</DrillDownMenuItem>
              <DrillDownMenuItem>Auto</DrillDownMenuItem>
            </DrillDownMenuSubContent>
          </DrillDownMenuSub>
        </DrillDownMenuGroup>
      </DrillDownMenuContent>
    </DrillDownMenu>
  );
}
