import { player } from '@/lib/video-player/player';

export function Video({ children }: { children?: React.ReactNode }) {
  const { videoRef } = player.usePlayerContext();

  return (
    <video
      crossOrigin="anonymous"
      ref={videoRef}
      playsInline
      className="w-full h-full"
    >
      {children}
    </video>
  );
}
