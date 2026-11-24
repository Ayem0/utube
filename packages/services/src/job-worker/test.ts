import { and, eq, type InferInsertModel } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  uuid,
  type AnyPgTable,
  type PgBuildColumn,
  type PgIntegerBuilder,
  type PgTextBuilder,
  type PgUpdateSetSource,
  type PgUUIDBuilder,
  type SetIsPrimaryKey,
} from "drizzle-orm/pg-core";
import { Duration, Effect, Schedule, UndefinedOr } from "effect";
import { DB } from "../db/db";
import { DBNotFoundError } from "../db/db-errors";

type ExtractDateColsKeys<TTable extends AnyPgTable> = {
  [
    K in keyof TTable["_"]["columns"] & keyof InferInsertModel<TTable>
  ]: TTable["_"]["columns"][K]["_"]["data"] extends Date ? K : never;
}[keyof TTable["_"]["columns"] & keyof InferInsertModel<TTable>];

type ExtractPrimaryKeyCols<TTable extends AnyPgTable> = {
  [
    K in keyof TTable["_"]["columns"]
  ]: TTable["_"]["columns"][K] extends PgBuildColumn<
    TTable["_"]["name"],
    | SetIsPrimaryKey<PgUUIDBuilder>
    | SetIsPrimaryKey<PgIntegerBuilder>
    | SetIsPrimaryKey<PgTextBuilder>
  >
    ? TTable["_"]["columns"][K]
    : never;
}[keyof TTable["_"]["columns"]];

type ExtractStringOrNumberCols<TTable extends AnyPgTable> = {
  [
    K in keyof TTable["_"]["columns"]
  ]: TTable["_"]["columns"][K] extends PgBuildColumn<
    TTable["_"]["name"],
    PgUUIDBuilder | PgIntegerBuilder | PgTextBuilder
  >
    ? TTable["_"]["columns"][K]
    : never;
}[keyof TTable["_"]["columns"]];

const jobWorker = <
  A,
  E,
  R,
  TTable extends AnyPgTable,
  TIdCol extends ExtractPrimaryKeyCols<TTable>,
  TAttemptIdCol extends ExtractStringOrNumberCols<TTable>,
>({
  cols,
  config,
  table,
  workEffect,
}: {
  table: TTable;
  cols: {
    lastHeartbeatAtColKey: ExtractDateColsKeys<TTable>;
    idCol: TIdCol;
    attemptIdCol: TAttemptIdCol;
  };
  workEffect: Effect.Effect<A, E, R>;
  config: {
    jobId: TIdCol["_"]["data"];
    attemptId: TAttemptIdCol["_"]["data"];
    heartbeatDelay: Duration.Duration;
  };
}) =>
  Effect.gen(function* () {
    const db = yield* DB;

    const updateHeartbeat = db
      .run((cl) =>
        cl
          .update(table)
          .set({
            [cols.lastHeartbeatAtColKey]: new Date(),
          } as PgUpdateSetSource<TTable>)
          .where(
            and(
              eq(cols.idCol, config.jobId),
              eq(cols.attemptIdCol, config.attemptId),
            ),
          )
          .returning()
          .pipe(
            Effect.map((res) => (Array.isArray(res) ? res : [res])),
            Effect.flatMap(([res]) =>
              UndefinedOr.match(res, {
                onUndefined: () =>
                  new DBNotFoundError({ message: "job not found" }),
                onDefined: (res) => Effect.succeed(res),
              }),
            ),
          ),
      )
      .pipe(
        Effect.repeat({ schedule: Schedule.fixed(config.heartbeatDelay) }),
        Effect.catch((cause) => Effect.gen(function* () {})),
      );
  });

const testTable = pgTable("test", {
  id: uuid("id").primaryKey(),
  attemptId: uuid("attempt_id"),
  lastHeartbeatAt: timestamp("last_heartbeat_at"),
  nullableTimestamp: timestamp("nullable_timestamp"),
});

// testTable.id.;

jobWorker({
  table: testTable,
  cols: {
    lastHeartbeatAtColKey: "lastHeartbeatAt",
    idCol: testTable.id,
    attemptIdCol: testTable.attemptId,
  },
  config: { heartbeatDelay: Duration.seconds(30), attemptId: "", jobId: "" },
  workEffect: Effect.gen(function* () {}),
});

// const testExtract = <TTable extends AnyPgTable>(
//   table: TTable,
//   cols?: {
//     lastHeartbeatAtCol: ExtractDateCols<TTable>;
//   },
// ) =>
//   Effect.gen(function* () {
//     const db = yield* DB;

//     const updateHeartbeat = db.run((cl) =>
//       cl.update(table).set({}).returning(),
//     );
//   });

// type AnyDateColumn = AnyPgColumn<{
//   data: Date;
//   generated: undefined;
//   identity: undefined;
// }>;

// type Cols = {
//   lastHeartbeatAt: AnyDateColumn;
//   leaseExpiresAt: AnyDateColumn;
// };

// type LeaseTable = AnyPgTable<{ columns: Cols }>;

// type Config<TTable extends LeaseTable = LeaseTable> = {
//   table: TTable;
// };

// type Test<
//   TTableConfig extends TableConfig,
//   TTable extends PgTableWithColumns<TTableConfig>,
//   TlastHearbeatAt extends string = "last_heartbeat_at",
//   TleaseExpiresAt extends string = "lease_expires_at",
// > = {
//   [K in keyof TTable["_"]["columns"] & keyof TTable["$inferInsert"]]: K extends
//     TleaseExpiresAt | TlastHearbeatAt
//     ? TTable["_"]["columns"][K] extends AnyDateColumn
//       ? TTable["_"]["columns"][K]
//       : never
//     : never;
// }[keyof TTable["_"]["columns"] & keyof TTable["$inferInsert"]];

// type T = InferTableColumnsModels;
// const makeConfig = <
//   TlastHearbeatAt extends string = "last_heartbeat_at",
//   TleaseExpiresAt extends string = "lease_expires_at",
// >(
//   table: AnyPgTable,
//   options?: {
//     lastHearbeatAtColumnName?: TlastHearbeatAt;
//     leaseExpiresAtColumnName?: TleaseExpiresAt;
//   },
// ): AnyPgTable<{
//   columns: Record<TlastHearbeatAt | TleaseExpiresAt, AnyDateColumn>;
// }> => {
//   const lastHeartbeatColName =
//     options?.lastHearbeatAtColumnName ?? "last_heartbeat_at";
//   const leaseExpiresColName =
//     options?.leaseExpiresAtColumnName ?? "lease_expires_at";

//   const cols = getTableColumns(table);

//   const isDateCol = (col: AnyPgColumn): col is AnyDateColumn => {
//     return col.dataType === "object date" && col._.data instanceof Date;
//   };
//   return table;
// };

// const useConfig = (config: Config<LeaseTable>) =>
//   Effect.gen(function* () {
//     const db = yield* DB;

//     const updateLease = Effect.gen(function* () {
//       yield* db.run((cl) =>
//         cl.update(config.table).set({ lastHeartbeatAt: new Date() }),
//       );
//     });

//     return { updateLease };
//   });
