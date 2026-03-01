import { getSessionVolumeState } from '@/frontend/lib/video-player-volume';
import { useEffect, useRef } from 'react';
import { VideoPlayerControls } from './video-player-controls';

export function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const initialVolume = useRef(getSessionVolumeState());

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = initialVolume.current.volume;
    video.muted = initialVolume.current.muted;
  }, []);

  return (
    <div className="bg-black w-full flex justify-center items-center relative hover:**:data-controls:flex">
      {/*  **:data-controls:hidden  */}
      <video ref={videoRef} autoPlay controls src={src} />
      <VideoPlayerControls
        videoRef={videoRef}
        initialVolume={initialVolume.current}
      />
    </div>
  );
}
