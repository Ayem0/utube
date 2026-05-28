import { player } from '@/lib/video-player/player';
import { useDebouncedCallback } from '@tanstack/react-pacer';

export function VideoPlayerContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { containerRef } = player.usePlayerContext();
  const isActive = player.usePlayerState((s) => s.interaction.isActive);
  const isFullscreen = player.usePlayerState((s) => s.display.fullscreen);
  const { setActive, setInactive } = player.usePlayerApi('interaction');
  const debouncedAutoHide = useDebouncedCallback(setInactive, {
    wait: 1500,
  });

  const setActiveAndDebounce = () => {
    setActive();
    debouncedAutoHide();
  };

  return (
    <div
      data-active={isActive}
      data-fullscreen={isFullscreen}
      onPointerEnter={setActiveAndDebounce}
      onPointerMove={setActiveAndDebounce}
      onPointerLeave={setInactive}
      onFocus={setActiveAndDebounce}
      onBlur={setInactive}
      onClick={setActiveAndDebounce}
      className="bg-black aspect-video flex w-full items-center justify-center relative max-h-[748px] data-[fullscreen=true]:aspect-auto data-[fullscreen=true]:max-h-full data-[active=false]:cursor-none group overflow-hidden"
      ref={containerRef}
    >
      {children}
    </div>
  );
}
