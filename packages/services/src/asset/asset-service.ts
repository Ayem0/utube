import type { AssetInsert } from "@repo/db/types";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import type { SqlError } from "effect/sql/SqlError";
import { DB } from "../db/db";
import type { DBNotFoundError } from "../db/db-errors";
import {
  InvalidMediaTypeError,
  type InvalidMediaSizeError,
} from "../media/media-errors";
import { S3 } from "../s3/s3";
import { S3Error } from "../s3/s3-errors";
import { newId } from "../utils/id";
import { AssetRepository } from "./asset-repository";
import { AssetUploadFactory } from "./asset-upload-factory";

export interface AssetServiceApi {
  createWithRelation: <A, E, R>({
    input,
    effect,
  }: {
    input: Pick<
      AssetInsert,
      "mimeType" | "ownerUserId" | "sizeBytes" | "type"
    > & { expiresInSeconds: number };
    effect: (assetId: string) => Effect.Effect<A, E, R>;
  }) => Effect.Effect<
    { assetId: string; presignedUrl: string; result: A },
    | EffectDrizzleQueryError
    | InvalidMediaTypeError
    | InvalidMediaSizeError
    | DBNotFoundError
    | S3Error
    | SqlError
    | E,
    R
  >;
}

export class AssetService extends Context.Service<
  AssetService,
  AssetServiceApi
>()("AssetService", {
  make: Effect.gen(function* () {
    const assetRepo = yield* AssetRepository;
    const assetUploadFactory = yield* AssetUploadFactory;
    const db = yield* DB;
    const s3 = yield* S3;
    return {
      createWithRelation: Effect.fnUntraced(function* ({ input, effect }) {
        const id = newId();
        yield* assetUploadFactory.validate({
          assetType: input.type,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        });
        const key = yield* assetUploadFactory.createAssetStorageKey({
          id,
          mimeType: input.mimeType,
          assetType: input.type,
        });

        const presignedUrl = yield* s3.getPresignedUrl({
          method: "PUT",
          key,
          bucket: "uploads",
          expiresInSeconds: input.expiresInSeconds,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        });

        const res = yield* Effect.gen(function* () {
          yield* assetRepo.create({
            id,
            ownerUserId: input.ownerUserId,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            type: input.type,
            key,
            uploadExpiresAt: new Date(
              Date.now() + input.expiresInSeconds * 1000,
            ),
          });
          const creatorRes = yield* effect(id);
          return creatorRes;
        }).pipe(db.withTransaction);

        return { assetId: id, presignedUrl, result: res };
      }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(AssetRepository.Layer),
    Layer.provide(AssetUploadFactory.Layer),
    Layer.provide(DB.Layer),
  );
}
