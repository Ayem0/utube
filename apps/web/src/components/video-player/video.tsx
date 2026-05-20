import { usePlayerContext } from '@/lib/video-player/player';

export function Video({ children }: { children?: React.ReactNode }) {
  const { videoRef } = usePlayerContext();

  return (
    <video ref={videoRef} playsInline className="w-full h-full">
      {children}
    </video>
  );
}
