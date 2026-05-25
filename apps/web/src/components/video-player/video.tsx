import { mainPlayer } from '@/lib/video-player/player';

export function Video({ children }: { children?: React.ReactNode }) {
  const { videoRef } = mainPlayer.usePlayerContext();

  return (
    <video ref={videoRef} playsInline className="w-full h-full">
      {children}
    </video>
  );
}
