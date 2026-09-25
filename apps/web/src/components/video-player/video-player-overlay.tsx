import {
  usePlayerApi,
  usePlayerRefs,
  usePlayerState,
} from '@/lib/video-player/create-player';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@repo/ui/components/context-menu';
import { displayFeature } from '@repo/video-player/feature/core/display';
import { playbackFeature } from '@repo/video-player/feature/core/playback';
import { Repeat2 } from 'lucide-react';

export function VideoPlayerOverlay() {
  const { toggleFullscreen } = usePlayerApi(displayFeature);
  const { togglePlay, toggleLoop } = usePlayerApi(playbackFeature);
  const looping = usePlayerState(playbackFeature, (s) => s.loop);
  const { containerRef } = usePlayerRefs();
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
