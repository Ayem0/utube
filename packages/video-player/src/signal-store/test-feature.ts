import type { VideoQuality } from "../types";
import { createFeature } from "./feature";
import { createPlayer } from "./player";

export interface QualityState {
  currentQuality: VideoQuality | null;
  qualities: readonly VideoQuality[];
  isAuto: boolean;
}

export const qualityFeature = createFeature({
  name: "quality",
  getState: (): QualityState => ({
    currentQuality: null,
    qualities: [],
    isAuto: false,
  }),
  getApi: (ctx) => ({
    setQuality: (index: number) => ctx.engine.setQuality(index),
  }),
  onSourceLoad: (ctx) => {
    const currentQuality = ctx.state.currentQuality();
    if (currentQuality) ctx.engine.setQuality(currentQuality.index);
  },
  onMediaAttach: (ctx) => {
    const qualities = ctx.engine.getQualities();
    const currentQuality = ctx.engine.getCurrentQuality();
    const isAuto = ctx.engine.getIsAuto();
    ctx.state({ currentQuality, qualities: [...qualities].reverse(), isAuto });

    ctx.events.engine("qualitiesChanged", (qualities) => {
      ctx.state.qualities([...qualities].reverse());
    });
    ctx.events.engine("qualityChanged", (quality) => {
      ctx.batch(() => {
        ctx.state.currentQuality(quality);
        ctx.state.isAuto(ctx.engine.getIsAuto());
      });
    });
  },
});

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
      const video = ctx.video();
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
      const video = ctx.video();
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
    const video = ctx.video();
    if (video) {
      video.volume = ctx.state.volume();
      video.muted = ctx.state.muted();
    }
    ctx.events.video("volumechange", () => {
      const video = ctx.video();
      if (!video) return;
      ctx.state({
        volume: video.volume,
        muted: video.muted,
      });
    });
  },
});

const player = createPlayer({
  features: [qualityFeature, volumeFeature],
  engineOptions: {
    quality: -1,
  },
  featureOptions: {
    volume: {
      stateArgs: [1, false],
      internalStateArgs: [1],
    },
  },
});
