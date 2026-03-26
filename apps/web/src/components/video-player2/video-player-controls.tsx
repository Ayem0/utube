import { RefObject } from 'react';
import { VideoPlayerFullscreenButton } from './video-player-fullscreen-button';
import { VideoPlayerPlayButton } from './video-player-play-button';
import { VideoPlayerSettings } from './video-player-settings';
import { VideoPlayerSlider } from './video-player-slider';
import { VideoPlayerTimer } from './video-player-timer';
import { VideoPlayerVolume } from './video-player-volume';

export function VideoPlayerControls({
  sliderContainerRef,
  timerElRef,
  durationElRef,
  playButtonRef,
  fullscreenButtonRef,
  sliderFillRef,
  sliderButtonRef,
  previewTimerRef,
  previewContainerRef,
  muteButtonRef,
  videoContainerRef,
}: {
  sliderContainerRef: RefObject<HTMLDivElement | null>;
  timerElRef: RefObject<HTMLSpanElement | null>;
  durationElRef: RefObject<HTMLSpanElement | null>;
  playButtonRef: RefObject<HTMLButtonElement | null>;
  fullscreenButtonRef: RefObject<HTMLButtonElement | null>;
  sliderFillRef: RefObject<HTMLDivElement | null>;
  sliderButtonRef: RefObject<HTMLDivElement | null>;
  previewTimerRef: RefObject<HTMLSpanElement | null>;
  previewContainerRef: RefObject<HTMLDivElement | null>;
  muteButtonRef: RefObject<HTMLButtonElement | null>;
  videoContainerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      data-controls
      className="absolute bottom-0 left-0 right-0 opacity-0 transition-opacity duration-200 ease-in-out"
    >
      <div className="flex flex-col w-full px-2 pb-2">
        <VideoPlayerSlider
          sliderContainerRef={sliderContainerRef}
          sliderFillRef={sliderFillRef}
          sliderButtonRef={sliderButtonRef}
          previewTimerRef={previewTimerRef}
          previewContainerRef={previewContainerRef}
        />
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <VideoPlayerPlayButton playButtonRef={playButtonRef} />
            <VideoPlayerVolume muteButtonRef={muteButtonRef} />
            <VideoPlayerTimer
              timerElRef={timerElRef}
              durationElRef={durationElRef}
            />
          </div>
          <div className="flex flex-row gap-2">
            <VideoPlayerSettings containerRef={videoContainerRef} />
            <VideoPlayerFullscreenButton
              fullscreenButtonRef={fullscreenButtonRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
