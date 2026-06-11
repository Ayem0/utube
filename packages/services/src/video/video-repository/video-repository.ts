import type { Asset, Video } from "@repo/db/types";
import { PaginationResult } from "@repo/types/types/pagination";
import { Context, Effect } from "effect";
import { DBError, DBNotFoundError } from "../../db/db-errors";
import { InvalidMediaFileNameError } from "../../media/media-errors";

export class VideoRepository extends Context.Tag("VideoRepository")<
  VideoRepository,
  VideoRepositoryService
>() {}

export interface VideoRepositoryService {
  update: (
    id: string,
    data: Partial<Video>,
  ) => Effect.Effect<Video, DBNotFoundError | DBError>;

  create: (
    data: Pick<Video, "channelId" | "title"> &
      Pick<Asset, "filename" | "mimeType" | "sizeBytes" | "type">,
  ) => Effect.Effect<
    { video: Video; asset: Asset },
    DBNotFoundError | DBError | InvalidMediaFileNameError
  >;

  delete: (id: string) => Effect.Effect<void, DBError>;

  getByChannelId: (
    channelId: string,
    userId: string,
    index: number,
    size: number,
  ) => Effect.Effect<PaginationResult<Video[]>, DBError | DBNotFoundError>;

  getById: (id: string) => Effect.Effect<Video, DBError | DBNotFoundError>;
}
