import { useRef } from 'react';
import { VideoPlayerProvider } from '../providers/video-player-provider';
import { VideoPlayerQualitySwitcher } from './video-player-quality-switcher';

export function VideoPlayer2({
  hlsUrl,
  dashUrl,
}: {
  hlsUrl: string;
  dashUrl: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);
  const timerElRef = useRef<HTMLSpanElement | null>(null);
  const durationElRef = useRef<HTMLSpanElement | null>(null);
  const playButtonRef = useRef<HTMLButtonElement | null>(null);
  const fullscreenButtonRef = useRef<HTMLButtonElement | null>(null);
  const sliderFillRef = useRef<HTMLDivElement | null>(null);
  const sliderButtonRef = useRef<HTMLDivElement | null>(null);
  const previewTimerRef = useRef<HTMLSpanElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const muteButtonRef = useRef<HTMLButtonElement | null>(null);
  return (
    <VideoPlayerProvider hlsUrl={hlsUrl} dashUrl={dashUrl} videoRef={videoRef}>
      <video ref={videoRef} controls={true} autoPlay playsInline />
      <VideoPlayerQualitySwitcher />
      {/*<VideoPlayerContainer videoContainerRef={videoContainerRef}>
         <VideoPlayerOverlay />
        <VideoPlayerControls
          sliderButtonRef={sliderButtonRef}
          sliderContainerRef={sliderContainerRef}
          timerElRef={timerElRef}
          durationElRef={durationElRef}
          playButtonRef={playButtonRef}
          fullscreenButtonRef={fullscreenButtonRef}
          sliderFillRef={sliderFillRef}
          previewTimerRef={previewTimerRef}
          previewContainerRef={previewContainerRef}
          muteButtonRef={muteButtonRef}
          videoContainerRef={videoContainerRef}
        />
      </VideoPlayerContainer> */}
    </VideoPlayerProvider>
  );
}
