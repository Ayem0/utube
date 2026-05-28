import { createFeature } from "../feature";

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
      if (video.currentTime === video.duration) {
        ctx.state.ended(true);
      } else {
        ctx.state.ended(false);
      }
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
    // TODO REMOVE
    ctx.events.video("seeked", () => {
      console.log("seeked");
    });
    ctx.events.video("seeking", () => {
      console.log("seeking");
    });
  },
});
