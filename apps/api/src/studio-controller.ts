import { ChannelRepository } from "@repo/services/channel/channel-repository";
import { VideoRepository } from "@repo/services/video/video-repository";
import { paginationSchema } from "@repo/types/schemas/pagination";
import { Effect } from "effect";
import Elysia from "elysia";
import { z } from "zod";
import { authPlugin } from "./auth";
import { apiRuntime } from "./runtime";

export const studioController = new Elysia()
  .use(authPlugin)
  .get(
    "/studio/channels/:channelId",
    async ({ user, status, params }) => {
      return await apiRuntime.runPromise(
        getChannelsByUserId(user.id, params.channelId).pipe(
          Effect.match({
            onSuccess: (res) => {
              return status(200, res);
            },
            onFailure: (e) => {
              console.log("ERROR", e);
              return status(500);
            },
          }),
        ),
      );
    },
    {
      auth: true,
    },
  )
  .get(
    "/studio/channels/:channelId/videos",
    async ({ user, status, params, query }) => {
      return await apiRuntime.runPromise(
        getVideosByChannelId(
          params.channelId,
          user.id,
          query.index,
          query.size,
        ).pipe(
          Effect.match({
            onSuccess: (res) => {
              return status(200, res);
            },
            onFailure: (e) => {
              console.log("ERROR", e);
              return status(500);
            },
          }),
        ),
      );
    },
    {
      query: paginationSchema,
      auth: true,
    },
  )
  .post(
    "/studio/channels/:channelId/videos",
    async ({ status, user, params }) => {
      // do things
      // return {videoId: string}
    },
    {
      auth: true,
    },
  )
  .post(
    "/studio/channels/:channelId/videos/:videoId/assets",
    async ({ status, user, params, query }) => {
      // return {presignUrl: string};
    },
    {
      body: z.object({
        type: z.literal(["video", "thumbnail"]),
        filename: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
      }),
      auth: true,
    },
  )
  .post(
    "/studio/channels/:channelId/videos/:videoId/assets/:assetId",
    async ({ status, user, params, query }) => {
      // return {presignUrl: string};
    },
    {
      body: z.object({
        status: z.literal(["UPLOADED", "FAILED"]),
      }),
      auth: true,
    },
  );

const getChannelsByUserId = (userId: string, channelId: string) =>
  Effect.gen(function* () {
    const repo = yield* ChannelRepository;
    return yield* repo.getStudioChannelById(channelId, userId);
  });

const getVideosByChannelId = (
  channelId: string,
  userId: string,
  index: number,
  size: number,
) =>
  Effect.gen(function* () {
    const repo = yield* VideoRepository;
    return yield* repo.getStudioVideosByChannelId(
      channelId,
      userId,
      index,
      size,
    );
  });
