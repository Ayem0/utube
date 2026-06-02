import { ChannelRepository } from "@repo/services/channel/channel-repository";
import { Effect } from "effect";
import Elysia from "elysia";
import { authPlugin } from "./auth";
import { channelMacro } from "./channel-macro";
import { apiRuntime } from "./runtime";

export const channelController = new Elysia()
  .use(authPlugin)
  .use(channelMacro)
  .get(
    "/channel",
    async ({ user, status, selectedChannelId }) => {
      return await apiRuntime.runPromise(
        getChannelsByUserId(user.id, selectedChannelId).pipe(
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
      channel: true,
      auth: true,
    },
  );

const getChannelsByUserId = (userId: string, selectedChannelId?: string) =>
  Effect.gen(function* () {
    const repo = yield* ChannelRepository;
    return yield* repo.getChannelsByUserId(userId, selectedChannelId);
  });
