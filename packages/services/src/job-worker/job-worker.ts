import { getTableColumns, type ColumnBaseConfig, type Table, type TableConfig } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { Context, Effect, Schema } from "effect";
import { DB } from "../db/db";

export class JobWorker extends Context.Service<JobWorker, {}>()("JobWorker") {}

const TableSchema = Schema.declare((table): table is PgTable => {
  if (!(table instanceof PgTable)) return false;
  // if (getTableColumns(table))

  return true;
});

import { is } from "drizzle-orm";

// Enforce required columns at compile time
type HasColumns<T extends PgTable, K extends string> =
  Exclude<K, keyof T["_"]["columns"]> extends never ? unknown : never;

export function createJobWorkerConfig<
  T extends PgTable,
  const K extends readonly string[],
>(table: T & HasColumns<T, K[number]>, requiredColumns: K) {
  const TableSchema = Schema.declare((input: unknown): input is T => {
    if (!is(input, PgTable) || input !== table) {
      return false;
    }

    const columns = getTableColumns(input);

    return requiredColumns.every((key) =>
      Object.prototype.hasOwnProperty.call(columns, key),
    );
  });

  return class JobWorkerConfig extends Schema.Class<JobWorkerConfig>(
    "JobWorkerConfig",
  )({
    table: TableSchema,
  }) {};
}

import { pgTable, text, uuid } from "drizzle-orm/pg-core";

const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey(),
  status: text("status").notNull(),
  payload: text("payload"),
});

// Infer the actual table and require id + status
const JobWorkerConfig = createJobWorkerConfig(jobs, ["id", "payload"]);

const config = Schema.decodeUnknownSync(JobWorkerConfig)({
  table: jobs,
});

// Exact Drizzle column inference is preserved
config.table.id;
config.table.status;
config.table.payload;

// Compile-time error: "missing" is not a column
// @ts-expect-error
createJobWorkerConfig(jobs, ["id", "missing"]);

// class JobWorkerconfig<T> extends Schema.Class<JobWorkerconfig<T>>("JobWorkerconfig")({

// })

// const JobWorkerConfig = Schema.Struct({
//   leaseTimeSeconds: Schema.Finite,
//   timeoutTimeSeconds: Schema.Finite,
//   jobTable: TableSchema,
// });

type JobWorkerConfig = Schema.Schema.Type<typeof JobWorkerConfig>;

export const make = <A, E, R>(
  config: JobWorkerConfig,
  workerEffect: Effect.Effect<A, E, R>,
) =>
  Effect.gen(function* () {
    const db = yield* DB;

    const updateLease = Effect.gen(function* () {
      yield* db.run((cl) => cl.update(config.table).set({}));
    });

    yield* Effect.scoped(Effect.gen(function* () {}));
  });

const makeConfig = <
TLeaseExpiresAtColumn,
  
  TTableConfig extends TableConfig,
  TTable extends Table<TTableConfig>,
>(
  table: TTable,
  options?: {
    leaseExpiresAtColumnName?: TLeaseExpiresAtColumn,
    lastHeartbeatAtColumnName?: string
  }
) => {
    declare type Column;
    if (options) {
        type Column
    }
    type Columns = options ?  Record<"test" | "ds", Column<ColumnBaseConfig<"string">>>;
  const tableSchema = Schema.declare(
    (input): input is  Table<TableConfig< => 
  );
};
