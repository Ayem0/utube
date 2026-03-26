import { Image } from '@unpic/react';
import { PointerEvent, RefObject, useEffect, useRef } from 'react';

export function VideoSlider({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);

    requestAnimationFrame(() => {
      previewRef.current?.style.setProperty('--left', `${x}px`);
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    const slider = sliderRef.current;
    const button = buttonRef.current;
    if (!video || !slider || !button) return;

    let rafId: number;

    const updateProgress = () => {
      const ct = video.currentTime;
      const ratio = ct / video.duration;
      const x = slider.clientWidth * ratio;
      slider.ariaValueNow = String(Math.floor(ct));
      button.style.setProperty('--left', `${x}px`);
    };

    const updateProgressRaf = () => {
      updateProgress();
      if (!video.paused && !video.ended) {
        rafId = requestAnimationFrame(updateProgressRaf);
      }
    };

    const onPlay = () => {
      rafId = requestAnimationFrame(updateProgressRaf);
    };

    const onPause = () => {
      cancelAnimationFrame(rafId);
    };

    const onResize = () => {
      updateProgress();
    };

    const onEnd = () => {
      requestAnimationFrame(() => {
        slider.ariaValueNow = String(Math.floor(video.duration));
      });
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnd);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnd);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="flex w-full px-2">
      <div className="flex w-full justify-center items-center">
        <div
          className="group/slider hover:**:data-preview:opacity-100 hover:**:data-preview:delay-100 hover:**:data-preview:visible py-2 flex w-full relative @container"
          onPointerMove={onMouseMove}
        >
          <div
            data-progress
            role="slider"
            tabIndex={0}
            aria-valuemax={0}
            aria-valuenow={0}
            className="bg-white h-1 w-full flex items-center relative rounded-lg @container group-hover/slider:h-1.5"
            ref={sliderRef}
          >
            <div
              data-progress-button
              ref={buttonRef}
              className="flex justify-center items-center absolute left-0 will-change-transform transform-[translate3d(var(--left),0,0)_translateX(-50%)] group-hover/slider:[&_div]:size-4"
            >
              <div className="bg-white size-3 rounded-full"></div>
            </div>
          </div>
          <div
            data-preview
            ref={previewRef}
            className="bg-white p-2 w-40 h-24 absolute bottom-10 opacity-0 transition-opacity duration-100 delay-0 will-change-transform 
            transform-[translate3d(clamp(80px,var(--left),calc(100cqi-80px)),0,0)_translateX(-50%)] pointer-events-none"
          >
            <div className="flex flex-col">
              <Image src="/" alt="" layout="fullWidth" />
              <p className="text-black">TODO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
