import {
  usePlayerApi,
  usePlayerContext,
  usePlayerState,
} from '@/lib/video-player/player';
import { useDebouncedCallback } from '@tanstack/react-pacer';

export function VideoPlayerContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { containerRef } = usePlayerContext();
  const isActive = usePlayerState('interaction', (s) => s.isActive);
  const isFullscreen = usePlayerState('display', (s) => s.fullscreen);
  const { setActive, setInactive } = usePlayerApi('interaction');
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
