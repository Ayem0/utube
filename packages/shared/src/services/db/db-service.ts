// // import { PgClient } from "@effect/sql-pg";
// // import * as PgDrizzle from "drizzle-orm/effect-postgres";
// // import { Context, Layer } from "effect";
// // import * as Effect from "effect/Effect";
// // import * as Redacted from "effect/Redacted";
// // import { types } from "pg";
// // import * as schema from "../../db/schema";

// // // Configure the PgClient layer with type parsers
// // export const PgClientLive = PgClient.layer({
// //   url: Redacted.make(process.env.DATABASE_URL!),
// //   types: {
// //     getTypeParser: (typeId, format) => {
// //       // Return raw values for date/time types to let Drizzle handle parsing
// //       if (
// //         [1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(typeId)
// //       ) {
// //         return (val: any) => val;
// //       }
// //       return types.getTypeParser(typeId, format);
// //     },
// //   },
// // });

// // // Define a DB service tag for dependency injection
// // export class DB extends Context.Tag("DB")<DB, DB.Service>() {}

// // export namespace DB {
// //   export const makeLive = () =>
// //     PgDrizzle.make({ schema: schema }).pipe(
// //       Effect.provide(PgDrizzle.DefaultServices),
// //     );
// //   export type Service = Effect.Effect.Success<ReturnType<typeof makeLive>>;
// //   export const Live = Layer.effect(
// //     DB,
// //     Effect.gen(function* () {
// //       return yield* makeLive();
// //     }),
// //   );
// // }

// import { Context, Effect, Layer } from "effect";
// import { db } from "./db";
// import { DBError } from "./db-errors";

// export class DB extends Context.Tag("DB")<DB, DB.Service>() {}

// type DBType = typeof db;

// export namespace DB {
//   export const makeLive = () => ({
//     query: <T>(fn: (db: DBType) => Promise<T>) =>
//       Effect.tryPromise({
//         try: async () => await fn(db),
//         catch: (e) =>
//           new DBError({ message: typeof e === "string" ? e : "DBError" }),
//       }),
//   });
//   export type Service = ReturnType<typeof makeLive>;
//   export const Live = Layer.succeed(DB, makeLive());
// }
