import z from "zod";
import { videoUploadSchema } from "../schemas/video-upload";

export type VideoUpload = z.infer<typeof videoUploadSchema>;
