import { z } from "zod";
import { videoVisibility } from "../enums/video/video-visibility";

export const videoPutSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(128, "Title cannot be longer than 128 characters"),
  description: z
    .string()
    .max(1024, "Description cannot be longer than 1024 characters")
    .or(z.undefined()),
  visibility: z.enum(videoVisibility, "Invalid visibility"),
});

export type VideoPutSchema = z.infer<typeof videoPutSchema>;
