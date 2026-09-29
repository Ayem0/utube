import { Config } from "effect";

export const CDNConfig = Config.unwrap({
  baseUrl: Config.NonEmptyString("CDN_BASE_URL"),
});
