import { createFeature } from "../feature";

export const authzFeature = createFeature({
  name: "authz",
  getState: () => ({}),
  getInternalState: () => ({
    token: null as string | null,
  }),
  getApi: (ctx) => ({
    setToken: (token: string) => {
      ctx.internalState.token = token;
      ctx.engine.setToken(token);
    },
    authorizedUrl: (input: string, base?: string) => {
      if (!ctx.internalState.token) return input;

      const url = new URL(input, base);
      url.searchParams.set("verify", ctx.internalState.token);
      return url.toString();
    },
  }),
});
