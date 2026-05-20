import { useVideoPlayerController } from '@/lib/video-player1/video-player-context';
import { Image } from '@unpic/react';
import { RefObject } from 'react';

export function VideoPlayerSlider({
  sliderContainerRef,
  sliderFillRef,
  sliderButtonRef,
  previewTimerRef,
  previewContainerRef,
}: {
  sliderContainerRef: RefObject<HTMLDivElement | null>;
  sliderFillRef: RefObject<HTMLDivElement | null>;
  sliderButtonRef: RefObject<HTMLDivElement | null>;
  previewTimerRef: RefObject<HTMLSpanElement | null>;
  previewContainerRef: RefObject<HTMLDivElement | null>;
}) {
  const {
    startHoveringPreview,
    stopHoveringPreview,
    startScrubbing,
    stopScrubbing,
    setPreviewX,
  } = useVideoPlayerController();
  return (
    <div
      className="w-full hover:**:data-preview:opacity-100 group/slider"
      ref={sliderContainerRef}
    >
      <div
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        data-progress
        // onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          e.preventDefault();
          startScrubbing();
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          e.preventDefault();
          stopScrubbing();
        }}
        onPointerEnter={() => startHoveringPreview()}
        onPointerMove={(e) => setPreviewX(e.clientX)}
        onPointerLeave={() => stopHoveringPreview()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        role="slider"
        tabIndex={0}
        aria-valuemax={0}
        aria-valuenow={0}
        className="h-4 w-full flex items-center relative @container hover:cursor-pointer"
      >
        <div className="absolute w-full rounded-full bg-zinc-500 h-1 group-hover/slider:h-1.5 overflow-hidden">
          <div
            ref={sliderFillRef}
            className="absolute left-0 h-1 group-hover/slider:h-1.5 w-full rounded-full bg-red-500 origin-left will-change-transform transform-[scaleX(0)]"
          />
        </div>

        <div
          data-progress-button
          ref={sliderButtonRef}
          className="flex justify-center items-center absolute left-0 origin-left will-change-transform transform-[translateX(0)] -translate-x-1/2"
        >
          <div className="bg-red-500 size-3 rounded-full group-focus-visible/slider:ring-2 group-hover/slider:size-4"></div>
        </div>
      </div>
      <div className="w-full relative @container justify-center items-center h-0">
        <div
          data-preview
          ref={previewContainerRef}
          className="bg-white p-2 w-40 h-24 absolute bottom-10 opacity-0  will-change-transform -translate-x-1/2
          transform-[translate3d(clamp(80px,0px,calc(100cqi-80px)),0,0)] pointer-events-none"
        >
          <div className="flex flex-col">
            <Image src="/" alt="" layout="fullWidth" />
            <span
              ref={previewTimerRef}
              className="text-black text-center"
            ></span>
          </div>
        </div>
      </div>
    </div>
  );
}
