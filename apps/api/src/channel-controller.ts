import { ChannelRepository } from "@repo/services/channel/channel-repository";
import { Effect } from "effect";
import Elysia from "elysia";
import { authMacro } from "./auth";
import { channelMacro } from "./channel-macro";
import { runtimePlugin } from "./runtime";

export const channelController = new Elysia()
  .use(authMacro)
  .use(channelMacro)
  .use(runtimePlugin)
  .get(
    "/channel",
    async ({ user, status, selectedChannelId, runEffect }) =>
      runEffect(
        Effect.gen(function* () {
          const repo = yield* ChannelRepository;
          return yield* repo.getChannelsByUserId({
            userId: user.id,
            selectedChannelId: selectedChannelId,
          });
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
      ),
    {
      channel: true,
      auth: true,
      runtime: true,
    },
  );
