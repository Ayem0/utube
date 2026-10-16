import type { RuntimeContext } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";

export class VideoProcessingDO extends Cloudflare.DurableObject<
  VideoProcessingDO,
  {
    process: (assetId: string) => Effect.Effect<void, unknown, RuntimeContext>;
  }
>()("VideoProcessingDO") {}
