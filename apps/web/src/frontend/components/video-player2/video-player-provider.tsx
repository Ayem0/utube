import {
  getSessionVolumeState,
  setSessionVolumeState,
} from '@/frontend/lib/video-player-volume';
import { VideoPlayerUiDesktopContext } from '@/frontend/lib/video-player/video-player-context';
import { VideoPlayerController2 } from '@/frontend/lib/video-player/video-player-controller';
import { VideoPlayerUIDesktop } from '@/frontend/lib/video-player/video-player-ui-desktop';
import { useEffect, useMemo } from 'react';

export function VideoPlayerProvider2({
  videoRef,
  videoContainerRef,
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
  children,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
  sliderContainerRef: React.RefObject<HTMLDivElement | null>;
  timerElRef: React.RefObject<HTMLSpanElement | null>;
  durationElRef: React.RefObject<HTMLSpanElement | null>;
  playButtonRef: React.RefObject<HTMLButtonElement | null>;
  fullscreenButtonRef: React.RefObject<HTMLButtonElement | null>;
  sliderFillRef: React.RefObject<HTMLDivElement | null>;
  sliderButtonRef: React.RefObject<HTMLDivElement | null>;
  previewTimerRef: React.RefObject<HTMLSpanElement | null>;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  muteButtonRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}) {
  const controller = useMemo(() => new VideoPlayerController2(), []);
  const ui = useMemo(() => new VideoPlayerUIDesktop(), []);

  useEffect(() => {
    if (
      !videoRef.current ||
      !videoContainerRef.current ||
      !sliderContainerRef.current ||
      !timerElRef.current ||
      !durationElRef.current ||
      !playButtonRef.current ||
      !fullscreenButtonRef.current ||
      !sliderFillRef.current ||
      !sliderButtonRef.current ||
      !previewTimerRef.current ||
      !previewContainerRef.current ||
      !muteButtonRef.current
    )
      return;

    controller.init(videoRef.current, getSessionVolumeState, (v, m) =>
      setSessionVolumeState({ volume: v, muted: m }),
    );

    ui.init(controller, {
      durationEl: durationElRef.current,
      timerEl: timerElRef.current,
      videoContainer: videoContainerRef.current,
      sliderContainer: sliderContainerRef.current,
      playButton: playButtonRef.current,
      fullscreenButton: fullscreenButtonRef.current,
      sliderFill: sliderFillRef.current,
      sliderButton: sliderButtonRef.current,
      previewTimer: previewTimerRef.current,
      previewContainer: previewContainerRef.current,
      muteButton: muteButtonRef.current,
    });

    return () => {
      controller.destroy();
      ui.destroy();
    };
  }, []);

  return (
    <VideoPlayerUiDesktopContext.Provider
      value={{ controller: controller, UI: ui }}
    >
      {children}
    </VideoPlayerUiDesktopContext.Provider>
  );
}
