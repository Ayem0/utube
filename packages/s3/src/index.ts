import { S3Client } from "bun";

export const s3Client = new S3Client({
  endpoint: process.env.AWS_S3_URL,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
