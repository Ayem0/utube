import { player } from '@/lib/video-player/player';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@repo/ui/components/context-menu';
import { Repeat2 } from 'lucide-react';

export function VideoPlayerOverlay() {
  const { toggleFullscreen } = player.usePlayerApi('display');
  const { togglePlay, toggleLoop } = player.usePlayerApi('playback');
  const looping = player.usePlayerState((s) => s.playback.loop);
  const { containerRef } = player.usePlayerContext();
  return (
    <div
      className="absolute inset-0"
      onClick={() => togglePlay(true)}
      onDoubleClick={toggleFullscreen}
    >
      <ContextMenu>
        <ContextMenuTrigger className="flex size-full" />
        <ContextMenuContent
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-background/50 backdrop-blur-3xl"
          container={containerRef}
        >
          <ContextMenuCheckboxItem
            className="focus:bg-muted"
            onClick={toggleLoop}
            checked={looping}
          >
            <Repeat2 className="size-6" />
            Loop
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
