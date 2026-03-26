// import { SQL } from "drizzle-orm";
// import { PgTable, SelectedFields } from "drizzle-orm/pg-core";
// import { Effect } from "effect";
// import { DBClient } from "./db-client";
// import { DBError } from "./db-errors";
// import { SelectedFieldsFlat } from "drizzle-orm/pg-core";

// export interface BaseRepository<
//   Table extends PgTable,
//   Row extends Table["$inferSelect"] = Table["$inferSelect"],
// > {
//   paginate(
//     index: number,
//     size: number,
//     where: SQL<unknown>,
//   ): Effect.Effect<
//     {
//       index: number;
//       size: number;
//       total: number;
//       data: Row[];
//     },
//     DBError
//   >;

//   paginateSelect<TSelection extends SelectedFieldsFlat>(
//     index: number,
//     size: number,
//     where: SQL<unknown>,
//     select: TSelection,
//   ): Effect.Effect<
//     {
//       index: number;
//       size: number;
//       total: number;
//       data: unknown;
//     },
//     DBError
//   >;
// }

// export const makeBaseRepository = (
//   table: PgTable,
// ): Effect.Effect<BaseRepository<PgTable>, never, DBClient> =>
//   Effect.gen(function* () {
//     const db = yield* DBClient;
//     return {
//       paginate: (index, size, where) =>
//         Effect.gen(function* () {
//           const total = yield* db.run((db) => db.$count(table, where));

//           // if total is less than the index * size, return the first page
//           if (total < index * size) {
//             const data = yield* db.run((db) =>
//               db.select().from(table).where(where).limit(size).offset(0),
//             );
//             return {
//               index: 0,
//               size: size,
//               total: total,
//               data: data,
//             };
//           }

//           const data = yield* db.run((db) =>
//             db
//               .select()
//               .from(table)
//               .where(where)
//               .limit(size)
//               .offset(index * size),
//           );

//           return {
//             index,
//             size,
//             total,
//             data: data,
//           };
//         }),
//       paginateSelect: <TSelection extends SelectedFieldsFlat>(
//         index: number,
//         size: number,
//         where: SQL<unknown>,
//         select: TSelection,
//       ) =>
//         Effect.gen(function* () {
//           const total = yield* db.run((db) => db.$count(table, where));

//           // if total is less than the index * size, return the first page
//           if (total < index * size) {
//             const data = yield* db.run((db) =>
//               db.select(select).from(table).where(where).offset(0),
//             );
//             return {
//               index: 0,
//               size: size,
//               total: total,
//               data: data,
//             };
//           }

//           const data = yield* db.run((db) =>
//             db
//               .select(select)
//               .from(table)
//               .where(where)
//               .limit(size)
//               .offset(index * size),
//           );

//           return {
//             index,
//             size,
//             total,
//             data: data,
//           };
//         }),
//     };
//   });
