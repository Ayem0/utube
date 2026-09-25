import { usePlayerRefs } from '@/lib/video-player/create-player';

export function Video({ children }: { children?: React.ReactNode }) {
  const { videoRef } = usePlayerRefs();

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
