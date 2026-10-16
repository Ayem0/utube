import * as Alchemy from "alchemy";
import { Queues } from "alchemy/Cloudflare";

export const VideoProcessingQueue = Queues.Queue("VideoProcessingQueue", {
  name: "video-processing-queue",
}).pipe(Alchemy.remote());
