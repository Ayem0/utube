import { createFeature } from "../factory";

export const interactionFeature = createFeature({
  name: "interaction",
  getInitialState: () => ({
    isActive: false,
  }),
  getApi: (ctx) => ({
    setActive: () => {
      ctx.setState({ isActive: true });
    },
    setInactive: () => {
      ctx.setState({ isActive: false });
    },
  }),
});
