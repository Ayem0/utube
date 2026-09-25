import { ChannelRepository } from "@repo/services/channel/channel-repository";
import { VideoService } from "@repo/services/video/video-service";
import { paginationSchema } from "@repo/types/schemas/pagination";
import { videoPutSchema } from "@repo/types/schemas/video-upload";
import { Effect } from "effect";
import Elysia from "elysia";
import { z } from "zod";
import { authMacro } from "./auth";
import { runtimePlugin } from "./runtime";

export const studioController = new Elysia()
  .use(authMacro)
  .use(runtimePlugin)
  .get(
    "/studio/channels/:channelId/videos",
    async ({ user, status, params, query, runEffect }) =>
      runEffect(
        Effect.gen(function* () {
          const serv = yield* VideoService;
          return yield* serv.getStudioByChannelId({
            desc: true,
            search: "",
            sort: {},
            filters: [],
            userId: user.id,
            channelId: params.channelId,
            index: query.index,
            size: query.size,
          });
        }).pipe(
          Effect.match({
            onSuccess: (res) => {
              return status(200, res);
            },
            onFailure: (err) => {
              switch (err._tag) {
                case "DBNotFoundError":
                  return status(404);
                default:
                  return status(500);
              }
            },
          }),
        ),
      ),
    {
      query: paginationSchema,
      auth: true,
      runtime: true,
    },
  )
  .post(
    "/studio/channels/:channelId/videos",
    async ({ status, user, params, body, runEffect }) =>
      runEffect(
        Effect.gen(function* () {
          const publisher = yield* VideoService;
          return yield* publisher.createDraft({
            channelId: params.channelId,
            userId: user.id,
            filename: body.filename,
            mimeType: body.mimeType,
            sizeBytes: body.sizeBytes,
          });
        }).pipe(
          Effect.match({
            onSuccess: (value) => {
              console.log("THE VALUE: ", value);
              return status(201, value);
            },
            onFailure: (err) => {
              console.log("ERROR IN THE MATCH: ", err);
              switch (err._tag) {
                case "InvalidMediaTypeError":
                  return status(415);
                case "DBNotFoundError":
                  return status(404);
                default:
                  return status(500);
              }
            },
          }),
        ),
      ),
    {
      auth: true,
      body: z.object({
        filename: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().positive(),
      }),
      runtime: true,
    },
  )
  .put(
    "/studio/channels/:channelId/videos/:videoId",
    async ({ status, user, params, body, runEffect }) =>
      runEffect(
        Effect.gen(function* () {
          const publisher = yield* VideoService;
          return yield* publisher.updateDraft({
            channelId: params.channelId,
            userId: user.id,
            videoId: params.videoId,
            data: {
              title: body.title,
              description: body.description ?? null,
              visibility: body.visibility,
            },
          });
        }).pipe(
          Effect.match({
            onSuccess: (value) => status(200, value),
            onFailure: (err) => {
              console.log("ERROR UPDATING VIDEO", err, err.cause);
              switch (err._tag) {
                case "DBNotFoundError":
                  return status(404);
                case "InvalidMediaTypeError":
                  return status(415);
                default:
                  return status(500);
              }
            },
          }),
        ),
      ),
    {
      auth: true,
      body: videoPutSchema,
      runtime: true,
    },
  )
  .get(
    "/studio/channels/:channelId",
    async ({ user, status, params, runEffect }) =>
      runEffect(
        Effect.match(
          Effect.gen(function* () {
            const repo = yield* ChannelRepository;
            return yield* repo.getStudioChannelById({
              channelId: params.channelId,
              userId: user.id,
            });
          }),
          {
            onSuccess: (res) => {
              return status(200, res);
            },
            onFailure: (err) => {
              switch (err._tag) {
                case "DBNotFoundError":
                  return status(404);
                default:
                  return status(500);
              }
            },
          },
        ),
      ),
    {
      auth: true,
      runtime: true,
    },
  )
  .get(
    "/studio/channels/:channelId/videos/:videoId",
    async ({ status, params, user, runEffect }) =>
      runEffect(
        Effect.gen(function* () {
          const repo = yield* VideoService;
          return yield* repo.getStudioById({
            channelId: params.channelId,
            userId: user.id,
            videoId: params.videoId,
          });
        }).pipe(
          Effect.match({
            onSuccess: (res) => {
              return status(200, res);
            },
            onFailure: (err) => {
              switch (err._tag) {
                case "DBNotFoundError":
                  return status(404);
                default:
                  return status(500);
              }
            },
          }),
        ),
      ),
    {
      auth: true,
      runtime: true,
    },
  );
// .post(
//   "/studio/channels/:channelId/videos/:videoId/assets",
//   async ({ status, user, params, body }) =>
//     await apiRuntime.runPromise(
//       Effect.gen(function* () {
//         const publisher = yield* VideoService;
//         return yield* publisher.addAsset({
//           channelId: params.channelId,
//           userId: user.id,
//           videoId: params.videoId,
//           data: {
//             type: body.type,
//             filename: body.filename,
//             mimeType: body.mimeType,
//             sizeBytes: body.sizeBytes,
//           },
//         });
//       }).pipe(
//         Effect.match({
//           onSuccess: (value) => {
//             return status(201, value);
//           },
//           onFailure: (err) => {
//             switch (err._tag) {
//               case "InvalidMediaTypeError":
//                 return status(415);
//               case "DBNotFoundError":
//                 return status(404);
//               default:
//                 return status(500);
//             }
//           },
//         }),
//       ),
//     ),
//   {
//     body: z.object({
//       type: z.enum(assetType),
//       filename: z.string(),
//       mimeType: z.string(),
//       sizeBytes: z.number().positive(),
//     }),
//     auth: true,
//   },
// )
// .post(
//   "/studio/channels/:channelId/videos/:videoId/assets/:assetId",
//   async ({ status, user, params, body }) => {
//     return await apiRuntime.runPromise(
//       Effect.gen(function* () {
//         const publisher = yield* VideoService;
//         return yield* publisher.updateAsset({
//           channelId: params.channelId,
//           userId: user.id,
//           assetId: params.assetId,
//           videoId: params.videoId,
//           status: body.status,
//         });
//       }).pipe(
//         Effect.match({
//           onSuccess: (value) => {
//             return status(201, value);
//           },
//           onFailure: (err) => {
//             switch (err._tag) {
//               case "DBNotFoundError":
//                 return status(404);
//               default:
//                 return status(500);
//             }
//           },
//         }),
//       ),
//     );
//   },
//   {
//     body: z.object({
//       status: z.enum(assetStatus),
//     }),
//     auth: true,
//   },
// );
