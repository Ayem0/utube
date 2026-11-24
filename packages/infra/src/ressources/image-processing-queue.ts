import { Queues } from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
export const ImageProcessingQueue = Queues.Queue("ImageProcessingQueue", {
  name: "image-processing-queue",
}).pipe(Alchemy.remote());
