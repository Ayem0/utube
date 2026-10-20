import * as Alchemy from "alchemy";
import { Queues } from "alchemy/Cloudflare";

export const ImageProcessingQueue = Queues.Queue("ImageProcessingQueue", {
  name: "image-processing-queue",
}).pipe(Alchemy.remote());
