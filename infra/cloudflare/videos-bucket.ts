import * as Cloudflare from "alchemy/Cloudflare";

export const VideosBucket = Cloudflare.R2.Bucket("videos", {
  name: "videos",
  cors: [
    {
      allowedMethods: ["GET", "HEAD"],
      allowedOrigins: ["*"],

      allowedHeaders: ["content-type"],

      exposeHeaders: ["ETag"],

      maxAgeSeconds: 3600,
    },
  ],
  publicAccess: false,
});
