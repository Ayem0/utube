import { ChannelRepository } from "@repo/services/channel/channel-repository";
import { VideoRepository } from "@repo/services/video/video-repository";
import { paginationSchema } from "@repo/types/schemas/pagination";
import { Effect } from "effect";
import Elysia from "elysia";
import { authPlugin } from "./auth";
import { apiRuntime } from "./runtime";

export const studioController = new Elysia()
  .use(authPlugin)
  .get(
    "/studio/channel/:channelId",
    async ({ user, status, params }) => {
      return await apiRuntime.runPromise(
        getChannelsByUserId(user.id, params.channelId).pipe(
          Effect.match({
            onSuccess: (res) => {
              console.log("get studio channel api fn", Date.now());
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
    "/studio/channel/:channelId/videos",
    async ({ user, status, params, query }) => {
      console.log("get studio videos api fn", Date.now());
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
