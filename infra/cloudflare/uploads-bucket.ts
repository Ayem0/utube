import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";

export const UploadsBucket = Cloudflare.R2.Bucket("uploads", {
  name: "uploads",
  cors: [
    {
      allowedMethods: ["DELETE", "GET", "HEAD", "PUT", "POST"],
      allowedOrigins: ["*"],

      allowedHeaders: ["content-type"],

      exposeHeaders: ["ETag"],

      maxAgeSeconds: 3600,
    },
  ],
}).pipe(Alchemy.remote());
