import { useRef } from 'react';
import { VideoPlayerContainer } from './video-player-container';
import { VideoPlayerControls } from './video-player-controls';
import { VideoPlayerOverlay } from './video-player-overlay';
import { VideoPlayerProvider } from './video-player-provider';

export function VideoPlayer({ src }: { src: string }) {
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
  return (
    <VideoPlayerProvider
      videoRef={videoRef}
      videoContainerRef={videoContainerRef}
      sliderContainerRef={sliderContainerRef}
      timerElRef={timerElRef}
      durationElRef={durationElRef}
      playButtonRef={playButtonRef}
      fullscreenButtonRef={fullscreenButtonRef}
      sliderFillRef={sliderFillRef}
      sliderButtonRef={sliderButtonRef}
      previewTimerRef={previewTimerRef}
      previewContainerRef={previewContainerRef}
    >
      <VideoPlayerContainer videoContainerRef={videoContainerRef}>
        <video
          ref={videoRef}
          src={src}
          controls={false}
          className="w-full h-full"
        />
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
        />
      </VideoPlayerContainer>
    </VideoPlayerProvider>
  );
}
