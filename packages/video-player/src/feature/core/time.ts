import { createFeature } from "../feature";

export type TimeState = {
  currentTimeStr: string | null;
  remainingTimeStr: string | null;
  invDuration: number;
  durationStr: string | null;
  duration: number;
};

export const timeFeature = createFeature({
  name: "time",
  getState: (): TimeState => ({
    currentTimeStr: null,
    remainingTimeStr: null,
    invDuration: 0,
    durationStr: null,
    duration: Infinity,
  }),

  getApi: (ctx) => ({
    setCurrentTimeFromRatio: (ratio: number) => {
      const duration = ctx.state.duration();
      if (!Number.isFinite(duration)) return;
      const newTime = duration * ratio;
      const newRemainingTime = duration - newTime;
      ctx.batch(() => {
        ctx.state.currentTimeStr(formatTime(newTime));
        ctx.state.remainingTimeStr("-" + formatTime(newRemainingTime));
      });
    },
  }),
  onMediaAttach: (ctx) => {
    const video = ctx.getVideo();
    if (!video) return;
    ctx.state({
      duration: video.duration,
      currentTimeStr: formatTime(video.currentTime),
      durationStr: formatTime(video.duration),
      invDuration: 1 / video.duration,
      remainingTimeStr: "-" + formatTime(video.duration - video.currentTime),
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

function formatTime(time: number) {
  if (!Number.isFinite(time)) return "--:--";
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
