import type { VideoQuality } from "../types";
import { createFeature } from "./feature";

export interface QualityState {
  currentQuality: VideoQuality | null;
  qualities: readonly VideoQuality[];
  isAuto: boolean;
}

export const qualityFeature = createFeature({
  name: "quality",
  getInitialState: (): QualityState => ({
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
