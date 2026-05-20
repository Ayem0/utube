import type { VideoQuality } from "../../types";
import { createFeature } from "../factory";

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
    setQuality: (index: number) => {
      const engine = ctx.getEngineApi();
      engine.setQuality(index);
    },
  }),
  onSourceLoad: (ctx) => {},
  onMediaAttach: (ctx) => {
    const engineApi = ctx.getEngineApi();
    const qualities = engineApi.getQualities();
    const currentQuality = engineApi.getCurrentQuality();
    const isAuto = engineApi.getIsAuto();
    ctx.setState({
      qualities: [...qualities].reverse(),
      currentQuality,
      isAuto,
    });
    ctx.addEngineEventListener("qualitiesChanged", (qualities) => {
      ctx.setState({ qualities: [...qualities].reverse() });
    });
    ctx.addEngineEventListener("qualityChanged", (quality) => {
      ctx.setState({ currentQuality: quality, isAuto: engineApi.getIsAuto() });
    });
  },
});
