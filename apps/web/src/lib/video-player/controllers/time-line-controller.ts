interface TimeLineControllerElements {
  timeLineContainer: HTMLDivElement;
  previewImage: HTMLImageElement;
  previewTimer: HTMLOutputElement;
}

export class TimeLineController {
  private video: HTMLVideoElement | null = null;
  private elements: TimeLineControllerElements | null = null;

  private togglePlay: () => void;
  private seek: (time: number) => void;
  private setCurrentTimeFromRatio: (ratio: number) => void;

  private paused = true;
  private ended = false;
  private duration = 0;
  private invDuration = 0;
  private isActive = false;

  private vfrcId: number | null = null;
  private rafId: number | null = null;
  private wasPlaying = false;
  private isScrubbing = false;
  private isHovering = false;
  private previewX = 0;
  private timeLineContainerOffsetLeft = 0;
  private timeLineContainerWidth = 0;
  private invTimeLineContainerWidth = 0;

  private observer: ResizeObserver | null = null;

  constructor(
    togglePlay: () => void,
    seek: (time: number) => void,
    setCurrentTimeFromRatio: (ratio: number) => void,
  ) {
    this.togglePlay = togglePlay;
    this.seek = seek;
    this.setCurrentTimeFromRatio = setCurrentTimeFromRatio;
  }

  public attach = (config: {
    video: HTMLVideoElement;
    elements: TimeLineControllerElements;
    isActive: boolean;
    ended: boolean;
    paused: boolean;
    duration: number;
    invDuration: number;
  }) => {
    this.video = config.video;
    this.elements = config.elements;
    this.paused = config.paused;
    this.ended = config.ended;
    this.duration = config.duration;
    this.invDuration = config.invDuration;
    this.isActive = config.isActive;
    this.initObservers();
    this.initContainerListener();
    this.startVFRC();
  };

  private initObservers = () => {
    if (!this.elements) return;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.elements?.timeLineContainer) {
          this.timeLineContainerWidth = entry.contentRect.width;
          this.invTimeLineContainerWidth = 1 / this.timeLineContainerWidth;
          this.timeLineContainerOffsetLeft =
            entry.target.getBoundingClientRect().left;
        }
      }
    });
    this.observer.observe(this.elements.timeLineContainer);
  };

  private initContainerListener = () => {
    if (!this.elements) return;
    this.elements.timeLineContainer.addEventListener(
      'pointerenter',
      this.onPointerEnter,
    );
    this.elements.timeLineContainer.addEventListener(
      'pointerleave',
      this.onPointerLeave,
    );
    this.elements.timeLineContainer.addEventListener(
      'pointermove',
      this.onPointerMove,
    );
    this.elements.timeLineContainer.addEventListener(
      'pointerdown',
      this.onPointerDown,
    );
    this.elements.timeLineContainer.addEventListener(
      'pointerup',
      this.onPointerUp,
    );
  };

  private onPointerMove = (e: PointerEvent) => {
    this.setPreviewX(e.clientX);
  };

  private onPointerEnter = () => {
    this.isHovering = true;
    this.startRafLoop();
  };

  private onPointerLeave = () => {
    this.isHovering = false;
    this.stopRafLoop();
  };

  private onPointerDown = (e: PointerEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
    this.isScrubbing = true;
    this.wasPlaying = !this.paused && !this.ended;
    if (this.wasPlaying) this.togglePlay();
  };

  private onPointerUp = (e: PointerEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.releasePointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
    this.isScrubbing = false;
    this.seek(this.previewX * this.invTimeLineContainerWidth * this.duration);
    if (this.wasPlaying) this.togglePlay();
  };

  private setPreviewX = (x: number) => {
    this.previewX = Math.max(
      0,
      Math.min(
        this.timeLineContainerWidth,
        x - this.timeLineContainerOffsetLeft,
      ),
    );
  };

  private rafLoop = () => {
    if ((!this.isScrubbing && !this.isHovering) || this.duration <= 0) return;
    if (this.isScrubbing) {
      const scale = this.previewX * this.invTimeLineContainerWidth;
      this.elements?.timeLineContainer.style.setProperty(
        '--pointerpx',
        this.previewX + 'px',
      );
      this.elements?.timeLineContainer.style.setProperty(
        '--fillpx',
        this.previewX + 'px',
      );
      this.elements?.timeLineContainer.style.setProperty(
        '--fill',
        String(scale),
      );
      this.setCurrentTimeFromRatio(scale);
      if (this.elements?.previewTimer) {
        this.elements.previewTimer.textContent = formatTime(
          this.duration * scale,
        );
      }
    } else if (this.isHovering) {
      const scale = this.previewX * this.invTimeLineContainerWidth;
      this.elements?.timeLineContainer.style.setProperty(
        '--pointerpx',
        this.previewX + 'px',
      );
      if (this.elements?.previewTimer) {
        this.elements.previewTimer.textContent = formatTime(
          this.duration * scale,
        );
      }
    }
    this.rafId = requestAnimationFrame(this.rafLoop);
  };

  private startRafLoop = () => {
    this.rafId = requestAnimationFrame(this.rafLoop);
  };

  private stopRafLoop = () => {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  private updatePosition = (t: number) => {
    if (!this.elements?.timeLineContainer) return;
    const fillpercent = t * this.invDuration;
    const fillpx = fillpercent * this.timeLineContainerWidth;
    this.elements.timeLineContainer.style.setProperty(
      '--fill',
      String(fillpercent),
    );
    this.elements.timeLineContainer.style.setProperty(
      '--fillpx',
      String(fillpx) + 'px',
    );
  };

  private vfrc: VideoFrameRequestCallback = (_, metadata) => {
    if (!this.video) return;
    this.updatePosition(metadata.mediaTime);
    if (!this.paused && !this.ended && this.isActive) {
      this.vfrcId = this.video.requestVideoFrameCallback(this.vfrc);
    }
  };

  private startVFRC = () => {
    if (!this.video) return;
    this.vfrcId = this.video.requestVideoFrameCallback(this.vfrc);
  };

  private stopVFRC = () => {
    if (!this.video) return;
    if (!this.vfrcId) return;
    this.video.cancelVideoFrameCallback(this.vfrcId);
    this.vfrcId = null;
  };
}

function formatTime(time: number) {
  if (!Number.isFinite(time)) return '--:--';
  const rounded = Math.round(time);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = Math.floor(rounded % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
