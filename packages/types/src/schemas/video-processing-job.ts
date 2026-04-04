import z from "zod";

export const videoProcessingJobSchema = z.object({
  rowId: z.uuid(),
  imageKey: z.string(),
  videoKey: z.string(),
});
