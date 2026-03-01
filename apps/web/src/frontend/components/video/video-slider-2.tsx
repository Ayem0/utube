import { Image } from '@unpic/react';
import {
  KeyboardEvent,
  PointerEvent,
  RefObject,
  useEffect,
  useRef,
} from 'react';

export function VideoSlider2({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const wasPlaying = useRef(false); // when video was playing before dragging
  const isHover = useRef(false); // when mouse is over the slider for preview
  const x = useRef(0); // client cursor x position

  useEffect(() => {
    const onResize = () => {
      const slider = sliderRef.current;
      const video = videoRef.current;
      const button = buttonRef.current;
      const fill = fillRef.current;
      if (!slider || !video || !button || !fill) return;

      x.current = (video.currentTime / video.duration) * slider.clientWidth;
      button.style.setProperty('--left', `${x.current}px`);
      fill.style.width = `${x.current}px`;
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const slider = sliderRef.current;
    const button = buttonRef.current;
    const fill = fillRef.current;
    if (!video || !slider || !button || !fill) return;

    const onEnd = () => {
      button.style.setProperty('--left', `${slider.clientWidth}px`);
      fill.style.width = `${slider.clientWidth}px`;
    };

    video.addEventListener('ended', onEnd);

    return () => {
      video.removeEventListener('ended', onEnd);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const slider = sliderRef.current;
    const button = buttonRef.current;
    const preview = previewRef.current;
    const fill = fillRef.current;
    if (!video || !slider || !button || !preview || !fill) return;

    let rafId: number;

    const loop = () => {
      if (isDragging.current) {
        video.currentTime = (x.current / slider.clientWidth) * video.duration;
        button.style.setProperty('--left', `${x.current}px`);
        fill.style.width = `${x.current}px`;
      }
      if (isHover.current) {
        preview.style.setProperty('--left', `${x.current}px`);
      }
      if (!video.paused && !video.ended && !isDragging.current) {
        const ct = video.currentTime;
        const ratio = ct / video.duration;
        const x = slider.clientWidth * ratio;
        slider.ariaValueNow = String(Math.floor(ct));
        button.style.setProperty('--left', `${x}px`);
        fill.style.width = `${x}px`;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    wasPlaying.current = !video.paused;
    video.pause();
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    if (wasPlaying.current) {
      video.play();
    }
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newX = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    x.current = newX;
  };

  const onPointerEnter = () => {
    isHover.current = true;
  };

  const onPointerLeave = () => {
    isHover.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const button = buttonRef.current;
    const slider = sliderRef.current;
    const fill = fillRef.current;
    if (!video || !button || !slider || !fill) return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      video.currentTime =
        e.key === 'ArrowLeft'
          ? Math.max(0, video.currentTime - 5)
          : Math.min(video.currentTime + 5, video.duration);
      x.current = (video.currentTime / video.duration) * slider.clientWidth;
      button.style.setProperty('--left', `${x.current}px`);
      fill.style.width = `${x.current}px`;
    }
  };

  return (
    <div className="w-full px-2 hover:**:data-preview:opacity-100 hover:**:data-preview:delay-100 hover:**:data-preview:visible">
      <div
        className="flex w-full h-4 items-center hover:cursor-pointer group/slider-container"
        onPointerMove={onPointerMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          data-progress
          onKeyDown={onKeyDown}
          role="slider"
          tabIndex={0}
          aria-valuemax={0}
          aria-valuenow={0}
          className="group/slider bg-zinc-500 h-1 w-full flex items-center relative rounded-lg @container group-hover/slider-container:h-1.5 hover:cursor-pointer"
          ref={sliderRef}
        >
          <div
            ref={fillRef}
            data-progress-fill
            className="absolute left-0 top-0 h-1 group-hover/slider-container:h-1.5 bg-red-500 rounded-sm will-change-transform"
          />
          <div
            data-progress-button
            ref={buttonRef}
            className="flex justify-center items-center absolute left-0 translate-x-[-50%] will-change-transform transform-[translateX(var(--left))] hover:cursor-pointer"
          >
            <div className="bg-red-500 size-3 rounded-full group-focus-visible/slider:ring-2 group-hover/slider-container:size-4"></div>
          </div>
        </div>
      </div>
      <div className="w-full relative @container justify-center items-center">
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
  );
}
// return (
//   <div className="flex w-full px-2">
//     <div className="w-full py-2 h-4 hover:**:data-preview:opacity-100 hover:**:data-preview:delay-100 hover:**:data-preview:visible relative @container justify-center items-center">
//       <div
//         onPointerMove={onPointerMove}
//         onPointerEnter={onPointerEnter}
//         onPointerLeave={onPointerLeave}
//         onDragStart={(e) => {
//           e.preventDefault();
//           e.stopPropagation();
//         }}
//         onPointerDown={onPointerDown}
//         onPointerUp={onPointerUp}
//         data-progress
//         onKeyDown={() => {
//           console.log('todo');
//         }}
//         role="slider"
//         tabIndex={0}
//         aria-valuemax={0}
//         aria-valuenow={0}
//         className="group/slider bg-zinc-500 h-1 w-full flex items-center relative rounded-lg @container hover:h-1.5 hover:cursor-pointer"
//         ref={sliderRef}
//       >
//         <div
//           ref={fillRef}
//           data-progress-fill
//           className="absolute left-0 top-0 h-1 group-hover/slider:h-1.5 bg-red-500 rounded-sm will-change-transform"
//         />
//         <div
//           data-progress-button
//           ref={buttonRef}
//           className="flex justify-center items-center absolute left-0 translate-x-[-50%] will-change-transform transform-[translateX(var(--left))] group-hover/slider:[&_div]:size-4 hover:cursor-pointer"
//         >
//           <div className="bg-red-500 size-3 rounded-full group-focus-visible/slider:ring-2"></div>
//         </div>
//       </div>
//       <div
//         data-preview
//         ref={previewRef}
//         className="bg-white p-2 w-40 h-24 absolute bottom-10 opacity-0 transition-opacity duration-100 delay-0 will-change-transform
//           transform-[translate3d(clamp(80px,var(--left),calc(100cqi-80px)),0,0)_translateX(-50%)] pointer-events-none"
//       >
//         <div className="flex flex-col">
//           <Image src="/" alt="" layout="fullWidth" />
//           <p className="text-black">TODO</p>
//         </div>
//       </div>
//     </div>
//   </div>
// );
