import { VideoPlayer } from '@/lib/video-player/video-player';
import { VideoPlayerControllerContext } from '@/lib/video-player/video-player-context';
import { VideoPlayerController } from '@/lib/video-player/video-player-controller';
import { useEffect, useMemo } from 'react';
export function VideoPlayerProvider({
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
  children: React.ReactNode;
}) {
  const engine = useMemo(() => new VideoPlayer(), []);
  const controller: VideoPlayerController = useMemo(
    () => ({
      togglePlay: engine.togglePlay,
      toggleMute: engine.toggleMute,
      setVolume: engine.setVolume,
      toggleFullscreen: engine.toggleFullscreen,
      startSettingVolume: engine.startSettingVolume,
      stopScrubbing: engine.stopScrubbing,
      startScrubbing: engine.startScrubbing,
      setPreviewX: engine.setPreviewX,
      startHoveringPreview: engine.startHoveringPreview,
      stopHoveringPreview: engine.stopHoveringPreview,
      startHoveringPlayer: engine.startHoveringPlayer,
      stopHoveringPlayer: engine.stopHoveringPlayer,
    }),
    [engine],
  );

  // const store: VideoPlayerStore = useMemo(
  //   () => ({
  //     subscribe: engine.subscribe,
  //     getSnapshot: engine.getSnapshot,
  //   }),
  //   [engine],
  // );

  useEffect(() => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    const slider = sliderContainerRef.current;
    const timer = timerElRef.current;
    const duration = durationElRef.current;
    const playButton = playButtonRef.current;
    const fullscreenButton = fullscreenButtonRef.current;
    const sliderFill = sliderFillRef.current;
    const sliderButton = sliderButtonRef.current;
    const previewTimer = previewTimerRef.current;
    const previewContainer = previewContainerRef.current;
    if (
      !video ||
      !container ||
      !slider ||
      !timer ||
      !duration ||
      !playButton ||
      !fullscreenButton ||
      !sliderFill ||
      !sliderButton ||
      !previewTimer ||
      !previewContainer
    )
      return;

    engine.attach(
      video,
      container,
      slider,
      timer,
      duration,
      playButton,
      fullscreenButton,
      sliderFill,
      sliderButton,
      previewTimer,
      previewContainer,
    );
    return () => engine.detach();
  }, []);
  return (
    <VideoPlayerControllerContext.Provider value={controller}>
      {/* <VideoPlayerStoreContext.Provider value={store}> */}
      {children}
      {/* </VideoPlayerStoreContext.Provider> */}
    </VideoPlayerControllerContext.Provider>
  );
}
