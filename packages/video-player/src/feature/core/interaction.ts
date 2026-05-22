import { createFeature } from "../feature";

export const interactionFeature = createFeature({
  name: "interaction",
  getState: () => ({
    isActive: false,
  }),
  getApi: (ctx) => ({
    setActive: () => {
      ctx.state.isActive(true);
    },
    setInactive: () => {
      ctx.state.isActive(false);
    },
  }),
});
