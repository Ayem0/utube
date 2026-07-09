import { AssetService } from "@repo/services/asset/asset-service";
import { assetStatus } from "@repo/types/enums/asset/asset-status";
import type { S3Event, SQSEvent } from "aws-lambda";
import { Effect, ManagedRuntime } from "effect";

export const handler = async (event: SQSEvent) => {
  console.log("EVENT RECEIVED", event);
  for (const record of event.Records) {
    const s3event: S3Event = JSON.parse(record.body);

    console.log("S3 EVENT", s3event);
    if (!s3event.Records) {
      console.log("No records found");
      continue;
    }

    for (const s3record of s3event.Records) {
      const key = s3record.s3.object.key;
      const { assetId, filename, name, ext } = processAssetKey(key);
      console.log("Key", key);
      console.log("assetId", assetId);
      console.log("filename", filename);
      console.log("name", name);
      console.log("ext", ext);
      console.log("Eventname", s3record.eventName);

      await runtime.runPromise(
        Effect.gen(function* () {
          const assetService = yield* AssetService;
          yield* assetService.updateStatus(assetId, assetStatus.UPLOADED);
        }),
      );
    }
  }
};

const runtime = ManagedRuntime.make(AssetService.Layer);

const processAssetKey = (key: string) => {
  const parts = key.split("/");
  if (parts.length < 2) throw new Error(`Invalid asset key format: ${key}`);

  const assetId = parts[0]!;
  const filename = parts[1]!;

  if (!filename.startsWith("original"))
    throw new Error(`Invalid asset filename: ${filename}`);

  const [name, ext] = filename.split(".");

  return {
    assetId,
    filename,
    name,
    ext,
  };
};
