import { useRef } from 'react';
import { VideoPlayerProvider } from '../providers/video-player-provider';
import { VideoPlayerQualitySwitcher } from './video-player-quality-switcher';

export function VideoPlayer2({
  hlsUrl,
  dashUrl,
  storyboardUrl,
}: {
  hlsUrl: string;
  dashUrl: string;
  storyboardUrl: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const thumbnailTrackRef = useRef<HTMLTrackElement | null>(null);
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
      <video
        ref={videoRef}
        controls={true}
        autoPlay
        playsInline
        crossOrigin="anonymous"
      >
        <track
          ref={thumbnailTrackRef}
          kind="metadata"
          label="thumbnails"
          src={storyboardUrl}
        />
      </video>
      <VideoPlayerQualitySwitcher />
      {/* <VideoPlayerContainer videoContainerRef={videoContainerRef}>
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

// useEffect(() => {
//   const trackEl = thumbnailTrackRef.current;
//   if (!trackEl) return;

//   const textTrack = trackEl.track;
//   textTrack.mode = 'hidden';

//   const logCues = () => {
//     console.log('readyState', trackEl.readyState);
//     console.log('cues', textTrack.cues);
//     console.log('activeCues', textTrack.activeCues);
//   };

//   const onLoad = () => {
//     console.log('track loaded');
//     logCues();
//   };

//   const onError = () => {
//     console.log('track error', trackEl.readyState);
//   };

//   const onCueChange = () => {
//     console.log('cueChange', textTrack.activeCues);
//   };

//   trackEl.addEventListener('load', onLoad);
//   trackEl.addEventListener('error', onError);
//   textTrack.addEventListener('cuechange', onCueChange);

//   // In case it loaded before listeners were attached
//   logCues();

//   return () => {
//     trackEl.removeEventListener('load', onLoad);
//     trackEl.removeEventListener('error', onError);
//     textTrack.removeEventListener('cuechange', onCueChange);
//   };
// }, [storyboardUrl]);
