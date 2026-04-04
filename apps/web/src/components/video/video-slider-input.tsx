import { PointerEvent, RefObject, useEffect, useRef } from 'react';

export function VideoSliderInput({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const sliderRef = useRef<HTMLInputElement>(null);

  const isPlaying = useRef(false);

  useEffect(() => {
    if (!videoRef.current || !sliderRef.current) return;

    let rafId: number;

    const updateProgress = () => {
      const video = videoRef.current!;
      if (!video.paused) {
        sliderRef.current!.value = String(video.currentTime / video.duration);
        rafId = requestAnimationFrame(updateProgress);
      }
    };

    const onPlay = () => {
      rafId = requestAnimationFrame(updateProgress);
    };

    const onPause = () => {
      cancelAnimationFrame(rafId);
    };

    const onEnd = () => {
      requestAnimationFrame(() => {
        sliderRef.current!.value = '1';
      });
    };

    videoRef.current.addEventListener('play', onPlay);
    videoRef.current.addEventListener('pause', onPause);
    videoRef.current.addEventListener('ended', onEnd);

    return () => {
      cancelAnimationFrame(rafId);
      videoRef.current?.removeEventListener('play', onPlay);
      videoRef.current?.removeEventListener('pause', onPause);
      videoRef.current?.removeEventListener('ended', onEnd);
    };
  }, [videoRef]);

  const onPointerUp = () => {
    if (!videoRef.current || !isPlaying.current) return;

    videoRef.current.play();
  };

  const onPointerMove = (e: PointerEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const ct = Number(e.currentTarget.value) * videoRef.current.duration;
    videoRef.current.currentTime = ct;
    if (ct >= videoRef.current.duration) {
      videoRef.current.pause();
      const endedEvent = new Event('ended', {
        bubbles: true,
        cancelable: false,
      });
      videoRef.current.dispatchEvent(endedEvent);
    } else {
      const timeupdateEvent = new Event('timeupdate', {
        bubbles: true,
        cancelable: false,
      });
      videoRef.current.dispatchEvent(timeupdateEvent);
    }
  };

  const onPointerDown = () => {
    if (!videoRef.current) return;

    isPlaying.current = !videoRef.current.paused;
    videoRef.current.pause();
  };

  return (
    <input
      type="range"
      ref={sliderRef}
      min={0}
      max={1}
      step={0.001}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    />
  );
}
