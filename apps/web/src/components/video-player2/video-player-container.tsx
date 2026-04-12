import { useVideoPlayerUiDesktop } from '@/components/providers/video-player-provider';
import { useDebouncedCallback } from '@tanstack/react-pacer';

export function VideoPlayerContainer({
  videoContainerRef,
  children,
}: {
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const UI = useVideoPlayerUiDesktop();

  const debouncedAutoHide = useDebouncedCallback(UI.stopHoveringPlayer, {
    wait: 2000,
  });

  const start = () => {
    UI.startHoveringPlayer();
    debouncedAutoHide();
  };

  return (
    <div
      ref={videoContainerRef}
      onPointerEnter={start}
      onPointerMove={start}
      onPointerLeave={UI.stopHoveringPlayer}
      onFocus={start}
      onBlur={UI.stopHoveringPlayer}
      onClick={start}
      data-active={false}
      data-fullscreen={false}
      className="bg-black flex w-full h-full data-[fullscreen=false]:max-h-[748px] max-h-full items-center justify-center relative data-[active=true]:**:data-controls:opacity-100 data-[active=false]:cursor-none data-[active=false]:**:data-controls:pointer-events-none group"
    >
      <div className="w-full h-full group-data-[fullscreen=true]:aspect-auto aspect-video">
        {children}
      </div>
    </div>
  );
}
