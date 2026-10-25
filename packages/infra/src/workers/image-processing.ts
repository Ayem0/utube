import type { RuntimeContext } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";

export class ImageProcessingDO extends Cloudflare.DurableObject<
  ImageProcessingDO,
  {
    process: (assetId: string) => Effect.Effect<void, unknown, RuntimeContext>;
  }
>()("ImageProcessingDO") {}
