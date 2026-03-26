import { VideoPlayerVolumeState } from '@/lib/video-player-volume';
import { RefObject } from 'react';
import { VideoPlayerPlayButton } from './video-player-play-button';
import { VideoPlayerVolume } from './video-player-volume';
import { VideoSlider2 } from './video-slider-2';

export function VideoPlayerControls({
  videoRef,
  initialVolume,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  initialVolume: VideoPlayerVolumeState;
}) {
  return (
    <div data-controls className="flex absolute bottom-0 left-0 right-0">
      <div className="flex flex-col w-full">
        {/* <VideoSlider videoRef={videoRef} /> */}
        <VideoSlider2 videoRef={videoRef} />
        <div className="flex flex-row p-2">
          <VideoPlayerPlayButton videoRef={videoRef} />
          <VideoPlayerVolume
            videoRef={videoRef}
            initialVolume={initialVolume}
          />
        </div>
      </div>
    </div>
  );
}
