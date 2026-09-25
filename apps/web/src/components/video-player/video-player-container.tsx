import {
  usePlayerApi,
  usePlayerRefs,
  usePlayerState,
} from '@/lib/video-player/create-player';
import { displayFeature } from '@repo/video-player/feature/core/display';
import { interactionFeature } from '@repo/video-player/feature/core/interaction';
import { useDebouncedCallback } from '@tanstack/react-pacer';

export function VideoPlayerContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { containerRef } = usePlayerRefs();
  const isActive = usePlayerState(interactionFeature, (s) => s.isActive);
  const isFullscreen = usePlayerState(displayFeature, (s) => s.fullscreen);
  const { setActive, setInactive } = usePlayerApi(interactionFeature);
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
