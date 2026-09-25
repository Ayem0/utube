import { Config } from "effect";

export const CDNConfig = Config.unwrap({
  baseUrl: Config.nonEmptyString("CDN_BASE_URL"),
});
