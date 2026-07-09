import { ChannelRepository } from "@repo/services/channel/channel-repository";
import { VideoRepository } from "@repo/services/video/video-repository";
import { VideoService } from "@repo/services/video/video-service";
import { paginationSchema } from "@repo/types/schemas/pagination";
import { videoPutSchema } from "@repo/types/schemas/video-upload";
import { Effect } from "effect";
import Elysia from "elysia";
import { z } from "zod";
import { authPlugin } from "./auth";
import { apiRuntime } from "./runtime";

export const studioController = new Elysia()
  .use(authPlugin)
  .post(
    "/studio/channels/:channelId/videos",
    async ({ status, user, params, body }) => {
      return await apiRuntime.runPromise(
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
      );
    },
    {
      auth: true,
      body: z.object({
        filename: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().positive(),
      }),
    },
  )
  .put(
    "/studio/channels/:channelId/videos/:videoId",
    async ({ status, user, params, body }) => {
      return await apiRuntime.runPromise(
        Effect.gen(function* () {
          const publisher = yield* VideoService;
          return yield* publisher.updateVideo({
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
      );
    },
    {
      auth: true,
      body: videoPutSchema,
    },
  )
  .get(
    "/studio/channels/:channelId",
    async ({ user, status, params }) => {
      return await apiRuntime.runPromise(
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
        Effect.gen(function* () {
          const repo = yield* VideoRepository;
          return yield* repo.getStudioByChannelId({
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
      );
    },
    {
      query: paginationSchema,
      auth: true,
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
