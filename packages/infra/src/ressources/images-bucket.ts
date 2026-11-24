import * as Cloudflare from "@alchemy.run/cloudflare";

export const ImagesBucket = Cloudflare.R2.Bucket("images", {
  name: "images",
  publicAccess: true,
});
