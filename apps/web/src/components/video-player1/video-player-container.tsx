import { useVideoPlayerController } from '@/lib/video-player1/video-player-context';

export function VideoPlayerContainer({
  videoContainerRef,
  children,
}: {
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const { startHoveringPlayer, stopHoveringPlayer } =
    useVideoPlayerController();

  return (
    <div
      ref={videoContainerRef}
      onPointerEnter={startHoveringPlayer}
      onPointerLeave={stopHoveringPlayer}
      className="bg-black flex flex-1 w-full max-h-[748px] justify-center items-center relative hover:**:data-controls:visible focus-within:**:data-controls:visible"
    >
      {children}
    </div>
  );
}
