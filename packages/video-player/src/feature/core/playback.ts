import { createFeature } from "../factory";

// type PlaybackState = {
//   paused: boolean;
//   waiting: boolean;
//   ended: boolean;
//   playbackRate: number;
// };

export const playbackFeature = createFeature({
  name: "playback",
  getInitialState: (defaultPlaybackRate: number = 1) => ({
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
      if (ctx.getState().ended && isOverlay) return;
      video.paused ? video.play() : video.pause();
    },
    toggleLoop: () => {
      const video = ctx.getVideo();
      if (!video) return;
      video.loop = !video.loop;
      ctx.setState({ loop: video.loop });
    },
  }),
  onMediaAttach: (ctx) => {
    const video = ctx.getVideo();
    if (!video) return;
    video.playbackRate = ctx.getState().playbackRate;
    ctx.setState({ paused: video.paused });
    ctx.setState({ ended: video.ended });
    ctx.setState({ loop: video.loop });
    ctx.addMediaEventListener("play", () => {
      ctx.setState({ paused: false, ended: false });
    });
    ctx.addMediaEventListener("pause", () => {
      ctx.setState({ paused: true });
    });
    ctx.addMediaEventListener("waiting", () => {
      ctx.setState({ waiting: true });
    });
    ctx.addMediaEventListener("playing", () => {
      ctx.setState({ waiting: false });
    });
    ctx.addMediaEventListener("ended", () => {
      ctx.setState({ ended: true });
    });
    ctx.addMediaEventListener("ratechange", () => {
      const video = ctx.getVideo();
      if (!video) return;
      ctx.setState({
        playbackRate: video.playbackRate,
      });
    });
  },
});
