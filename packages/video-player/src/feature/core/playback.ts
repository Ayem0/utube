import { createFeature } from "../feature";

// type PlaybackState = {
//   paused: boolean;
//   waiting: boolean;
//   ended: boolean;
//   playbackRate: number;
// };

let seekStart = 0;

function dumpBuffered(video: HTMLVideoElement) {
  const ranges: string[] = [];

  for (let i = 0; i < video.buffered.length; i++) {
    ranges.push(
      `${video.buffered.start(i).toFixed(3)}-${video.buffered.end(i).toFixed(3)}`,
    );
  }

  return ranges.join(", ");
}

function isBuffered(video: HTMLVideoElement, time: number) {
  for (let i = 0; i < video.buffered.length; i++) {
    if (time >= video.buffered.start(i) && time <= video.buffered.end(i)) {
      return true;
    }
  }

  return false;
}

export const playbackFeature = createFeature({
  name: "playback",
  getState: (defaultPlaybackRate: number = 1) => ({
    paused: true,
    waiting: false,
    ended: false,
    loop: false,
    playbackRate: defaultPlaybackRate,
  }),
  getApi: (ctx) => ({
    setPlaybackRate: (playbackRate: number) => {
      const video = ctx.getVideo();
      if (!video) return;
      video.playbackRate = playbackRate;
    },
    play: () => {
      const video = ctx.getVideo();
      if (!video) return;
      video.play();
    },
    pause: () => {
      const video = ctx.getVideo();
      if (!video) return;
      video.pause();
    },
    seek: (time: number) => {
      const video = ctx.getVideo();
      if (!video) return;
      video.currentTime = time;
    },
    togglePlay: (isOverlay: boolean = false) => {
      const video = ctx.getVideo();
      if (!video) return;
      if (ctx.state.ended() && isOverlay) return;
      video.paused ? video.play() : video.pause();
    },
    toggleLoop: () => {
      const video = ctx.getVideo();
      if (!video) return;
      video.loop = !video.loop;
      ctx.state.loop(video.loop);
    },
  }),
  onMediaAttach: (ctx) => {
    const video = ctx.getVideo();
    if (!video) return;
    video.playbackRate = ctx.state.playbackRate();
    ctx.batch(() => {
      ctx.state.paused(video.paused);
      ctx.state.ended(video.ended);
      ctx.state.loop(video.loop);
    });
    ctx.events.video("play", () => {
      ctx.batch(() => {
        ctx.state.paused(false);
        ctx.state.ended(false);
      });
    });
    ctx.events.video("pause", () => {
      ctx.state.paused(true);
    });
    ctx.events.video("waiting", () => {
      ctx.state.waiting(true);
    });
    ctx.events.video("playing", () => {
      ctx.state.waiting(false);
    });
    ctx.events.video("ended", () => {
      ctx.state.ended(true);
    });
    ctx.events.video("ratechange", () => {
      const video = ctx.getVideo();
      if (!video) return;
      ctx.state.playbackRate(video.playbackRate);
    });
  },
});
