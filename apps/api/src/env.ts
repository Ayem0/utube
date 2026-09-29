import { env } from "cloudflare:workers";
import type { UtubeApiEnv } from "../alchemy.run";

export const Env = env as UtubeApiEnv;
