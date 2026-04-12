import { VideoPlayer } from '@repo/video-player/video-player';
import { createContext, useContext, useEffect, useMemo } from 'react';

export const VideoPlayerContext = createContext<VideoPlayer | null>(null);

export function useVideoPlayer() {
  const videoPlayer = useContext(VideoPlayerContext);
  if (!videoPlayer) {
    throw new Error('useVideoPlayer must be used inside VideoPlayerProvider');
  }
  return videoPlayer;
}

export function VideoPlayerProvider({
  children,
  videoRef,
  hlsUrl,
  dashUrl,
}: {
  children: React.ReactNode;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hlsUrl: string;
  dashUrl: string;
}) {
  const videoPlayer = useMemo(() => new VideoPlayer(), []);
  useEffect(() => {
    console.log('here in the effect');
    if (!videoRef.current) return;
    videoPlayer.attach(videoRef.current, hlsUrl, dashUrl);
    return () => {
      videoPlayer.destroy();
    };
  }, []);
  return (
    <VideoPlayerContext.Provider value={videoPlayer}>
      {children}
    </VideoPlayerContext.Provider>
  );
}
