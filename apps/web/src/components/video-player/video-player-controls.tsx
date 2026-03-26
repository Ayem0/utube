import { VideoPlayerFullscreenButton } from './video-player-fullscreen-button';
import { VideoPlayerPlayButton } from './video-player-play-button';
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
}: {
  sliderContainerRef: React.RefObject<HTMLDivElement | null>;
  timerElRef: React.RefObject<HTMLSpanElement | null>;
  durationElRef: React.RefObject<HTMLSpanElement | null>;
  playButtonRef: React.RefObject<HTMLButtonElement | null>;
  fullscreenButtonRef: React.RefObject<HTMLButtonElement | null>;
  sliderFillRef: React.RefObject<HTMLDivElement | null>;
  sliderButtonRef: React.RefObject<HTMLDivElement | null>;
  previewTimerRef: React.RefObject<HTMLSpanElement | null>;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      data-controls
      className="absolute bottom-0 left-0 right-0
     invisible
    "
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
            <VideoPlayerVolume />
            <VideoPlayerTimer
              timerElRef={timerElRef}
              durationElRef={durationElRef}
            />
          </div>
          <div className="flex flex-row gap-2">
            <VideoPlayerFullscreenButton
              fullscreenButtonRef={fullscreenButtonRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
