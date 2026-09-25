// import Elysia from "elysia";
// import { authPlugin } from "./auth";

// export const assetController = new Elysia().use(authPlugin).post(
//   "/assets",
//   async ({ status, user, body }) => {
//     return await apiRuntime.runPromise(
//       Effect.gen(function* () {
//         const publisher = yield* VideoPublisher;
//         return yield* publisher.createDraft({
//           channelId: body.channelId,
//           userId: user.id,
//           data: {
//             filename: body.filename,
//             mimeType: body.mimeType,
//             sizeBytes: body.sizeBytes,
//             type: assetType.VIDEO,
//           },
//         });
//       }).pipe(
//         Effect.match({
//           onSuccess: (value) => {
//             console.log("THE VALUE: ", value);
//             return status(201, value);
//           },
//           onFailure: (err) => {
//             console.log("ERROR IN THE MATCH: ", err);
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
//     );
//   },
//   {
//     auth: true,
//     body: z.object({
//       filename: z.string(),
//       mimeType: z.string(),
//       sizeBytes: z.number().positive(),
//     }),
//   },
// );
