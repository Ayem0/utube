import z from "zod";

export const videoProcessingJobSchema = z.object({
  rowId: z.uuid(),
  videoKey: z.string(),
});
