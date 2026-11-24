import type { Asset, Channel, Video, VideoPlayback } from "@repo/db/types";
import { assetType, type AssetType } from "@repo/types/enums/asset/asset-type";
import type {
  PaginationRequest,
  PaginationResult,
} from "@repo/types/types/pagination";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";
import type { SqlError } from "effect/sql/SqlError";
import { AssetService } from "../asset/asset-service";
import { CDN } from "../cdn/cdn";
import { DBNotFoundError } from "../db/db-errors";
import {
  InvalidMediaTypeError,
  type InvalidMediaSizeError,
} from "../media/media-errors";
import type { S3Error } from "../s3/s3-errors";
import { newId } from "../utils/id";
import type { VideoPlaybackError } from "./video-errors";
import { VideoPlayback as VideoPlaybackService } from "./video-playback";
import { VideoRepository, type StudioLightVideo } from "./video-repository";

type WatchVideo = Pick<
  Video,
  "id" | "description" | "title" | "publishedAt" | "duration" | "visibility"
> & {
  channel: Pick<Channel, "alias" | "name"> & {
    variants: NonNullable<Asset["variants"]>["variants"] | null;
  };
  hlsMasterUrl: string;
  dashManifestUrl: string;
  storyboardUrl: string;
  renditions: VideoPlayback["renditions"];
};

type StudioVideo = Pick<
  Video,
  "id" | "description" | "title" | "visibility" | "duration"
> & {
  source: Pick<Asset, "status">;
  thumbnail: {
    current: {
      status: Asset["status"];
      variants: NonNullable<Asset["variants"]>["variants"] | null;
    } | null;
    pending: {
      status: Asset["status"];
      variants: NonNullable<Asset["variants"]>["variants"] | null;
    } | null;
  };
  playback: {
    hlsMasterUrl: string | null;
    dashManifestUrl: string | null;
    storyboardUrl: string | null;
  } | null;
};

export interface VideoServiceApi {
  createDraft: (params: {
    userId: string;
    channelId: string;
    mimeType: string;
    filename: string;
    sizeBytes: number;
  }) => Effect.Effect<
    {
      videoId: string;
      presignedUrl: string;
      title: string;
    },
    | InvalidMediaSizeError
    | InvalidMediaTypeError
    | DBNotFoundError
    | EffectDrizzleQueryError
    | SqlError
    | S3Error
  >;

  getWatchById: (params: {
    id: string;
    userId?: string;
  }) => Effect.Effect<
    WatchVideo & { token: string; exp: number },
    DBNotFoundError | EffectDrizzleQueryError | VideoPlaybackError
  >;

  refreshPlaybackToken: (params: {
    userId?: string;
    videoId: string;
  }) => Effect.Effect<
    { token: string; exp: number },
    EffectDrizzleQueryError | VideoPlaybackError | DBNotFoundError
  >;

  getStudioByChannelId: (
    params: PaginationRequest<{}, {}> & { channelId: string; userId: string },
  ) => Effect.Effect<
    PaginationResult<StudioLightVideo[]>,
    EffectDrizzleQueryError | DBNotFoundError
  >;

  getStudioById: (params: {
    userId: string;
    channelId: string;
    videoId: string;
  }) => Effect.Effect<StudioVideo, EffectDrizzleQueryError | DBNotFoundError>;

  updateDraft: (params: {
    userId: string;
    channelId: string;
    videoId: string;
    data: Pick<Video, "title" | "description" | "visibility">;
  }) => Effect.Effect<
    { id: string },
    DBNotFoundError | InvalidMediaTypeError | EffectDrizzleQueryError
  >;

  addAsset: (params: {
    userId: string;
    channelId: string;
    videoId: string;
    type: AssetType;
    mimeType: string;
    sizeBytes: number;
  }) => Effect.Effect<
    { url: string },
    | S3Error
    | EffectDrizzleQueryError
    | SqlError
    | DBNotFoundError
    | InvalidMediaSizeError
    | InvalidMediaTypeError
  >;
}

export class VideoService extends Context.Service<
  VideoService,
  VideoServiceApi
>()("VideoService", {
  make: Effect.gen(function* () {
    const videoRepo = yield* VideoRepository;
    const cdn = yield* CDN;
    const cdnBaseUrl = yield* cdn.getBaseUrl;
    const videoPlayback = yield* VideoPlaybackService;
    const assetService = yield* AssetService;

    const mapAssetVariants = (
      obj: Asset["variants"],
    ): NonNullable<Asset["variants"]>["variants"] | null => {
      if (obj === null) return null;

      switch (obj.type) {
        case assetType.VIDEO_THUMBNAIL:
          return {
            "1280x720": `${cdnBaseUrl}/thumbnail/${obj.variants["1280x720"]}`,
            "640x360": `${cdnBaseUrl}/thumbnail/${obj.variants["640x360"]}`,
          };
        case assetType.CHANNEL_AVATAR:
          return {
            "160x160": `${cdnBaseUrl}/avatar/${obj.variants["160x160"]}`,
            "64x64": `${cdnBaseUrl}/avatar/${obj.variants["64x64"]}`,
          };
      }
    };
    return {
      addAsset: Effect.fnUntraced(function* ({
        channelId,
        mimeType,
        sizeBytes,
        type,
        userId,
        videoId,
      }) {
        const attach = Effect.fnUntraced(function* (assetId: string) {
          switch (type) {
            case assetType.VIDEO_THUMBNAIL:
              return yield* videoRepo.setPendingThumbnailAssetId({
                channelId,
                userId,
                assetId,
                videoId,
              });
            default:
              return yield* new InvalidMediaTypeError({
                message: "Invalid asset type",
              });
          }
        });
        const { presignedUrl, result } = yield* assetService.createWithRelation(
          {
            input: {
              mimeType,
              ownerUserId: userId,
              sizeBytes,
              type,
              expiresInSeconds: 86400,
            },
            effect: attach,
          },
        );
        return { url: presignedUrl };
      }),
      refreshPlaybackToken: Effect.fnUntraced(function* ({ userId, videoId }) {
        const res = yield* videoRepo.canRefreshPlaybackToken({
          userId,
          videoId,
        });
        return yield* videoPlayback.createPlaybackToken(res);
      }),
      createDraft: Effect.fn(function* ({
        userId,
        channelId,
        filename,
        mimeType,
        sizeBytes,
      }) {
        const title = filename.split(".")[0] ?? "Title";
        const videoId = newId();

        const { assetId, presignedUrl } =
          yield* assetService.createWithRelation({
            input: {
              mimeType,
              sizeBytes,
              type: assetType.VIDEO,
              ownerUserId: userId,
              expiresInSeconds: 86400,
            },
            effect: (assetId) =>
              videoRepo.create({
                id: videoId,
                channelId: channelId,
                title: title,
                sourceVideoAssetId: assetId,
                userId,
              }),
          });

        return { assetId, presignedUrl, title, videoId };
      }),
      updateDraft: videoRepo.updateStudio,
      getStudioByChannelId: ({ userId, channelId, index, size }) =>
        videoRepo.getStudioByChannelId({
          filters: {},
          sort: {},
          desc: true,
          search: "",
          userId,
          channelId,
          index,
          size,
        }),
      getWatchById: ({ id, userId }) =>
        Effect.gen(function* () {
          const row = yield* videoRepo.getWatchById({ id, userId });
          const { token, exp } = yield* videoPlayback.createPlaybackToken({
            durationSeconds: row.duration || 0,
            playbackId: row.playback.id,
            videoId: row.id,
          });
          return {
            id: row.id,
            description: row.description,
            title: row.title,
            publishedAt: row.publishedAt,
            duration: row.duration,
            visibility: row.visibility,
            channel: {
              alias: row.channel.alias,
              name: row.channel.name,
              variants: row.channel.variants?.variants,
            },
            token: token,
            exp: exp,
            hlsMasterUrl: `${cdnBaseUrl}/${row.playback.hlsMasterKey}`,
            dashManifestUrl: `${cdnBaseUrl}/${row.playback.dashManifestKey}`,
            storyboardUrl: `${cdnBaseUrl}/${row.playback.storyboardKey}`,
            renditions: row.playback.renditions,
          };
        }),

      getStudioById: ({ userId, channelId, videoId }) =>
        Effect.gen(function* () {
          const row = yield* videoRepo.getStudioById({
            userId,
            channelId,
            videoId,
          });
          return {
            id: row.id,
            title: row.title,
            description: row.description,
            visibility: row.visibility,
            source: {
              status: row.sourceVideoAsset.status,
            },
            thumbnail: {
              current: row.currentThumbnail
                ? {
                    status: row.currentThumbnail.status,
                    variants: mapAssetVariants(row.currentThumbnail.variants),
                  }
                : null,
              pending: row.pendingThumbnail
                ? {
                    status: row.pendingThumbnail.status,
                    variants: mapAssetVariants(row.pendingThumbnail.variants),
                  }
                : null,
            },
            publishedAt: row.publishedAt,
            duration: row.duration,
            playback: {
              hlsMasterUrl: `${cdnBaseUrl}/${row.playback.hlsMasterKey}`,
              dashManifestUrl: `${cdnBaseUrl}/${row.playback.dashManifestKey}`,
              storyboardUrl: `${cdnBaseUrl}/${row.playback.storyboardKey}`,
              renditions: row.playback.renditions,
            },
          };
        }),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(VideoRepository.Layer),
    Layer.provide(AssetService.Layer),
    Layer.provide(VideoPlaybackService.Layer),
    Layer.provide(CDN.Layer),
  );
}
