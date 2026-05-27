import { TimelineController } from '@/lib/video-player/controllers/timeline-controller';
import { mainPlayer } from '@/lib/video-player/player';
import { useEffect, useMemo, useRef } from 'react';

export function VideoPlayerTimeline() {
  const { videoRef } = mainPlayer.usePlayerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewTimerRef = useRef<HTMLOutputElement>(null);
  const controller = useMemo(
    () => new TimelineController(mainPlayer.getControllerContext()),
    [],
  );
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef?.current;
    if (!video || !container || !previewTimerRef.current || !imgRef.current)
      return;

    controller.attach(video, {
      previewImage: imgRef.current,
      previewTimer: previewTimerRef.current,
      timelineContainer: container,
    });
    return () => controller.detach();
  }, []);

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
          data-buffer
          className="origin-left absolute inset-y-0 left-0 w-full bg-gray-500 will-change-transform transform-[scaleX(var(--buffered))]"
        />
        <div
          data-fill
          className="origin-left absolute inset-y-0 left-0 w-full bg-red-500 will-change-transform transform-[scaleX(var(--fill))]"
        />
      </div>
      <div
        data-thumb
        className="rounded-full absolute bg-red-500 size-3 group-hover/timeline:size-4 left-0 origin-left will-change-transform transform-[translateX(calc(var(--fillpx)-50%))] focus-within:ring-4 ring-ring/50"
      />
      <div
        data-thumbnail-preview
        className="absolute bottom-10 will-change-transform transform-[translate3d(calc(clamp(80px,var(--pointerpx),calc(100cqi-80px))-50%),0,0)] pointer-events-none group-hover/timeline:opacity-100 opacity-0"
      >
        <div className="relative w-[160px] h-[90px] bg-gray-600 rounded-md overflow-hidden">
          <img
            ref={imgRef}
            src={undefined}
            alt=""
            className="max-w-none left-0 top-0 will-change-transform origin-top-left absolute"
          />
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
