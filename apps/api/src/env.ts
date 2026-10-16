import { env } from "cloudflare:workers";
import type { ApiEnv } from "../alchemy.run";

export const Env = env as ApiEnv;
