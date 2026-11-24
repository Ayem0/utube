import * as Cloudflare from "@alchemy.run/cloudflare";
import type { RuntimeContext } from "alchemy";
import { Effect } from "effect";

export class VideoProcessingDO extends Cloudflare.DurableObject<
  VideoProcessingDO,
  {
    process: (params: {
      assetId: string;
      sizeBytes: number;
    }) => Effect.Effect<void, unknown, RuntimeContext>;
  }
>()("VideoProcessingDO") {}
