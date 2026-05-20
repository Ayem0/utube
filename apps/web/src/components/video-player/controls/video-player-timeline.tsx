import { TimeLineController } from '@/lib/video-player/controllers/time-line-controller';
import {
  usePlayerApi,
  usePlayerContext,
  usePlayerState,
} from '@/lib/video-player/player';
import { useLayoutEffect, useMemo, useRef } from 'react';

export function VideoPlayerTimeline() {
  const { videoRef } = usePlayerContext();
  const { togglePlay, seek } = usePlayerApi('playback');
  const isActive = usePlayerState('interaction', (s) => s.isActive);
  const { ended, paused } = usePlayerState('playback');
  const invDuration = usePlayerState('time', (s) => s.invDuration);
  const duration = usePlayerState('time', (s) => s.duration);
  const { setCurrentTimeFromRatio } = usePlayerApi('time');

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewTimerRef = useRef<HTMLOutputElement>(null);
  const controller = useMemo(
    () => new TimeLineController(togglePlay, seek, setCurrentTimeFromRatio),
    [],
  );
  useLayoutEffect(() => {
    const container = containerRef.current;
    const video = videoRef?.current;
    if (!video || !container || !previewTimerRef.current || !imgRef.current)
      return;

    controller.attach({
      duration,
      invDuration,
      video,
      elements: {
        previewImage: imgRef.current,
        previewTimer: previewTimerRef.current,
        timeLineContainer: container,
      },
      ended,
      isActive,
      paused,
    });
  }, [paused, ended, invDuration, isActive]);

  return (
    <div
      role="slider"
      tabIndex={0}
      ref={containerRef}
      className="w-full flex relative h-3 cursor-pointer items-center @container group/timeline"
    >
      <div
        data-track
        className="absolute left-0 right-0 bg-zinc-700 h-1 group-hover/timeline:h-1.5 group-focus/timeline-within:h-1.5 rounded-full overflow-hidden"
      >
        <div
          data-fill
          className="origin-left absolute inset-y-0 left-0 w-full bg-red-500 will-change-transform transform-[scaleX(var(--fill))]"
        />
        <div data-buffer className="absolute inset-y-0 left-0 bg-gray-500" />
      </div>
      <div
        data-thumb
        className="rounded-full absolute bg-red-500 size-3 group-hover/timeline:size-4 left-0 origin-left will-change-transform transform-[translateX(calc(var(--fillpx)-50%))] focus-within:ring-4 ring-ring/50"
      />
      <div
        data-thumbnail-preview
        className="absolute bottom-10 will-change-transform transform-[translate3d(calc(clamp(80px,var(--pointerpx),calc(100cqi-80px))-50%),0,0)] pointer-events-none group-hover/timeline:opacity-100 opacity-0"
      >
        <div className="relative w-[160px] h-[90px] bg-gray-600  rounded-md overflow-hidden">
          <img ref={imgRef} src={undefined} alt="" />
        </div>
        <output
          ref={previewTimerRef}
          className="absolute -bottom-7 inset-x-1 text-center bg-black/20 rounded-full"
        >
          --:--
        </output>
      </div>
    </div>
  );
}
