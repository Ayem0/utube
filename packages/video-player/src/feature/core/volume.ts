// import { createFeature } from "../factory";

import { createFeature } from "../feature";

// export const volumeFeature = createFeature({
//   name: "volume",
//   getInitialState: (
//     defaultVolume: number = 1,
//     defaultMuted: boolean = false,
//   ) => ({
//     volume: defaultVolume,
//     muted: defaultMuted,
//   }),
//   getInternalInitialState: (defaultVolume: number = 1) => ({
//     lastVolume: defaultVolume,
//   }),
//   getApi: (ctx) => {
//     const setVolume = (volume: number) => {
//       const video = ctx.getVideo();
//       if (!video) return;

//       if (volume === 0) {
//         video.muted = true;
//         video.volume = ctx.getInternalState().lastVolume;
//       } else {
//         video.muted = false;
//         video.volume = volume;
//       }
//     };
//     const setLastVolume = () => {
//       ctx.setInternalState({
//         lastVolume: ctx.getState().volume,
//       });
//     };
//     const setMuted = (muted: boolean) => {
//       const video = ctx.getVideo();
//       if (!video) return;
//       video.muted = muted;
//     };
//     return {
//       setMuted,
//       setVolume,
//       setLastVolume,
//     };
//   },
//   onMediaAttach: (ctx) => {
//     const video = ctx.getVideo();
//     if (video) {
//       video.volume = ctx.getState().volume;
//       video.muted = ctx.getState().muted;
//     }
//     ctx.addMediaEventListener("volumechange", () => {
//       const video = ctx.getVideo();
//       if (!video) return;
//       ctx.setState({
//         volume: video.volume,
//         muted: video.muted,
//       });
//     });
//   },
// });
export const volumeFeature = createFeature({
  name: "volume",
  getState: (defaultVolume: number = 1, defaultMuted: boolean = false) => ({
    volume: defaultVolume,
    muted: defaultMuted,
  }),
  getInternalState: (defaultVolume: number = 1) => ({
    lastVolume: defaultVolume,
  }),
  getApi: (ctx) => {
    const setVolume = (volume: number) => {
      const video = ctx.getVideo();
      if (!video) return;

      if (volume === 0) {
        video.muted = true;
        video.volume = ctx.internalState.lastVolume;
      } else {
        video.muted = false;
        video.volume = volume;
      }
    };
    const setLastVolume = () => {
      ctx.internalState.lastVolume = ctx.state.volume();
    };
    const setMuted = (muted: boolean) => {
      const video = ctx.getVideo();
      if (!video) return;
      video.muted = muted;
    };
    return {
      setMuted,
      setVolume,
      setLastVolume,
    };
  },
  onMediaAttach: (ctx) => {
    const video = ctx.getVideo();
    if (video) {
      video.volume = ctx.state.volume();
      video.muted = ctx.state.muted();
    }
    ctx.events.video("volumechange", () => {
      const video = ctx.getVideo();
      if (!video) return;
      ctx.state({
        volume: video.volume,
        muted: video.muted,
      });
    });
  },
});
