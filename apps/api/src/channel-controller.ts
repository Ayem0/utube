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
        Effect.gen(function* () {
          const repo = yield* ChannelRepository;
          const channels = yield* repo.getChannelsByUserId({
            userId: user.id,
            selectedChannelId: selectedChannelId,
          });
          console.log("CHANNELS", channels);
          return channels;
        }).pipe(
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
