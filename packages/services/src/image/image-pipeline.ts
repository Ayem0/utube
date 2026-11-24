import type { Asset } from "@repo/db/types";
import { assetStatus } from "@repo/types/enums/asset/asset-status";
import { assetType } from "@repo/types/enums/asset/asset-type";
import type { ImageAssetType } from "@repo/types/enums/image/image-type";
import { entries, fromEntries } from "@repo/types/utils/typed-entries";
import { type EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer, Stream } from "effect";
import { exponential } from "effect/Schedule";
import type { SqlError } from "effect/sql/SqlError";
import { AssetRepository } from "../asset/asset-repository";
import { ChannelRepository } from "../channel/channel-repository";
import { DB } from "../db/db";
import type { DBNotFoundError } from "../db/db-errors";
import { S3 } from "../s3/s3";
import type { S3Error } from "../s3/s3-errors";
import { VideoRepository } from "../video/video-repository";
import { WS } from "../ws/ws";
import { ImageProcessingError, InvalidAssetTypeError } from "./image-errors";
import { ImageProcessor } from "./image-processor";
import { ImageValidator, type ImageValidationError } from "./image-validator";

export interface ImagePipelineService {
  process: (params: {
    assetId: string;
  }) => Effect.Effect<
    void,
    | EffectDrizzleQueryError
    | DBNotFoundError
    | S3Error
    | InvalidAssetTypeError
    | ImageProcessingError
    | ImageValidationError
    | SqlError
  >;
}

export class ImagePipeline extends Context.Service<
  ImagePipeline,
  ImagePipelineService
>()("ImagePipeline", {
  make: Effect.gen(function* () {
    const assetRepo = yield* AssetRepository;
    const videoRepo = yield* VideoRepository;
    const s3 = yield* S3;
    const imageProcessor = yield* ImageProcessor;
    const imageValidator = yield* ImageValidator;
    const channelRepo = yield* ChannelRepository;
    const db = yield* DB;
    const ws = yield* WS;
    return {
      process: ({ assetId }) =>
        Effect.gen(function* () {
          const { asset, relation } = yield* Effect.gen(function* () {
            const asset = yield* assetRepo.claimForProcessing({
              assetId,
            });

            if (
              asset.type !== assetType.VIDEO_THUMBNAIL &&
              asset.type !== assetType.CHANNEL_AVATAR
            )
              return yield* new InvalidAssetTypeError({
                message: "Asset type isnt a image asset type",
              });

            const relation = yield* assetRepo.getRelation({
              assetId: asset.id,
              assetType: asset.type,
            });

            const typedAss = asset as Asset & { type: ImageAssetType };
            return { asset: typedAss, relation };
          }).pipe(db.withTransaction);

          yield* Effect.gen(function* () {
            yield* Effect.log("Getting file");
            const fileStream = s3.getFile({
              key: asset.originalStorageKey,
              bucket: "uploads",
            });
            yield* Effect.log("Got file");

            yield* Effect.log("Collecting");

            const collected = yield* Stream.runCollect(fileStream);
            yield* Effect.log("Collected");

            const input = Buffer.concat(collected);

            yield* Effect.log("Validating");
            yield* imageValidator.validate({ input: input, type: asset.type });
            yield* Effect.log("Validated");

            const outputs = yield* imageProcessor.process({
              input: input,
              type: asset.type,
            });

            yield* Effect.log("Processed");

            const variants = yield* Effect.forEach(
              entries(outputs),
              ([key, value]) =>
                Effect.gen(function* () {
                  const s3key = `${assetId}/${key}`;
                  yield* s3
                    .uploadFile({
                      key: s3key,
                      file: value.buffer,
                      bucket: "images",
                      size: BigInt(value.buffer.byteLength),
                    })
                    .pipe(
                      Effect.retry({
                        times: 3,
                        schedule: exponential("100 millis"),
                      }),
                    );
                  return [key, s3key] as const;
                }),
            );

            yield* Effect.gen(function* () {
              yield* assetRepo.unclaimFromProcessingReady({
                type: asset.type,
                assetId,
                status: assetStatus.READY,
                renditions: {
                  type: asset.type,
                  variants: fromEntries(variants),
                },
              });
              switch (asset.type) {
                case assetType.VIDEO_THUMBNAIL:
                  return yield* videoRepo.updateCurrentThumbnailAssetIdWithPendingAssetId(
                    {
                      videoId: relation.id,
                    },
                  );
                case assetType.CHANNEL_AVATAR:
                  return yield* channelRepo.updateCurrentAvatarAssetIdWithPendingAssetId(
                    {
                      channelId: relation.id,
                    },
                  );
              }
            }).pipe(db.withTransaction);

            switch (asset.type) {
              case assetType.VIDEO_THUMBNAIL:
                const videoRel = relation as Effect.Success<
                  ReturnType<
                    typeof assetRepo.getRelation<
                      typeof assetType.VIDEO_THUMBNAIL
                    >
                  >
                >;
                yield* ws.send(asset.ownerUserId, {
                  type: "video.upload.updated",
                  channelId: videoRel.channelId,
                  videoId: videoRel.id,
                });
                break;
              case assetType.CHANNEL_AVATAR:
                const channelRel = relation as Effect.Success<
                  ReturnType<
                    typeof assetRepo.getRelation<
                      typeof assetType.CHANNEL_AVATAR
                    >
                  >
                >;
              // TODO add ws send when avatar changed wsEvent exists
              // return yield* ws.send(asset.ownerUserId, {
              //   type: "channel.avatar.updated",
              //   channelId: channelRel.id,
              // })
            }
          }).pipe(
            Effect.catch((cause) =>
              Effect.gen(function* () {
                yield* assetRepo.unclaimFromProcessingFailed({
                  assetId,
                  status: assetStatus.FAILED,
                });

                if (asset.type === assetType.VIDEO_THUMBNAIL) {
                  const videoRel = relation as Effect.Success<
                    ReturnType<
                      typeof assetRepo.getRelation<
                        typeof assetType.VIDEO_THUMBNAIL
                      >
                    >
                  >;

                  yield* ws.send(asset.ownerUserId, {
                    type: "video.upload.updated",
                    channelId: videoRel.channelId,
                    videoId: videoRel.id,
                  });
                }

                return yield* new ImageProcessingError({
                  cause: cause,
                  message: "Error processing image",
                });
              }),
            ),
          );
        }).pipe(
          Effect.catch(
            (c) =>
              new ImageProcessingError({
                message: "Error processing image",
                cause: c,
              }),
          ),
        ),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(AssetRepository.Layer),
    Layer.provide(DB.Layer),
    Layer.provide(VideoRepository.Layer),
    Layer.provide(ChannelRepository.Layer),
    // Layer.provide(ImageProcessor.Layer),
    // Layer.provide(ImageValidator.Layer),
  );
}
