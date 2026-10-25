import * as Cloudflare from "alchemy/Cloudflare";

export const ImagesBucket = Cloudflare.R2.Bucket("images", {
  name: "images",
  publicAccess: true,
});
