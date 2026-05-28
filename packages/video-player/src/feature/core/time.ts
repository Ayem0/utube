import { createFeature } from "../feature";

type TimeState = {
  currentTimeStr: string | null;
  remainingTimeStr: string | null;
  invDuration: number;
  durationStr: string | null;
  duration: number;
  bufferedEnd: number;
};

export const timeFeature = createFeature({
  name: "time",
  getState: (): TimeState => ({
    currentTimeStr: null,
    remainingTimeStr: null,
    invDuration: 0,
    durationStr: null,
    duration: Infinity,
    bufferedEnd: 0,
  }),

  getApi: (ctx) => ({
    setCurrentTimeWhenScrubbing: (ratio: number) => {
      const duration = ctx.state.duration();
      if (!Number.isFinite(duration) || Number.isNaN(duration)) return;
      const newTime = duration * ratio;
      const newRemainingTime = duration - newTime;
      ctx.batch(() => {
        ctx.state.currentTimeStr(formatTime(newTime));
        ctx.state.remainingTimeStr("-" + formatTime(newRemainingTime));
      });
    },
  }),
  onSetup: (ctx) => {
    ctx.events.engine("bufferedEnd", (end) => {
      ctx.state.bufferedEnd(end);
    });
  },
  onMediaAttach: (ctx) => {
    const video = ctx.getVideo();
    if (!video) return;

    ctx.batch(() => {
      ctx.state.duration(video.duration);
      ctx.state.currentTimeStr(formatTime(video.currentTime));
      ctx.state.durationStr(formatTime(video.duration));
      ctx.state.invDuration(1 / video.duration);
      ctx.state.remainingTimeStr(
        "-" + formatTime(video.duration - video.currentTime),
      );
    });
    ctx.events.video("timeupdate", () => {
      const video = ctx.getVideo();
      if (!video) return;
      ctx.batch(() => {
        ctx.state.currentTimeStr(formatTime(video.currentTime));
        ctx.state.remainingTimeStr(
          "-" + formatTime(video.duration - video.currentTime),
        );
      });
    });
    ctx.events.video("durationchange", () => {
      const video = ctx.getVideo();
      if (!video) return;
      ctx.batch(() => {
        ctx.state.duration(video.duration);
        ctx.state.durationStr(formatTime(video.duration));
        ctx.state.invDuration(1 / video.duration);
      });
    });
  },
});

export function formatTime(time: number) {
  if (!Number.isFinite(time) || Number.isNaN(time)) return "--:--";
  const rounded = Math.round(time);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = Math.floor(rounded % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
