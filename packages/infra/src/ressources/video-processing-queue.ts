import { Queues } from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";

export const VideoProcessingQueue = Queues.Queue("VideoProcessingQueue", {
  name: "video-processing-queue",
}).pipe(Alchemy.remote());
