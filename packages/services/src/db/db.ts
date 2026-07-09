import { PgClient } from "@effect/sql-pg";
import { relations } from "@repo/db/relations";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { PgEffectTransaction } from "drizzle-orm/pg-core/effect";
import { Context, Effect, Layer, Redacted } from "effect";

// TODO : benchmark bunsqlclient vs node pg client
const make = PgDrizzle.make({ relations });
export type DBApi = Effect.Success<typeof make>;
type Relations = typeof relations;

type DBTransaction = PgEffectTransaction<
  PgDrizzle.EffectPgQueryEffectHKT,
  PgQueryResultHKT,
  Relations
>;
export type RepoFn<I, A, E = never, R = never> = (
  input: I,
  tx?: DBTransaction,
) => Effect.Effect<A, E, R>;

export function repoFn<I, A, E = never, R = never>(
  fn: (input: I, dbOrTx: DBApi | DBTransaction) => Effect.Effect<A, E, R>,
  db: DBApi,
): RepoFn<I, A, E, R> {
  return (input, tx) => fn(input, tx ?? db);
}

export class DB extends Context.Service<DB, DBApi>()("DB", {
  make: make,
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PgDrizzle.DefaultServices),
    Layer.provide(
      PgClient.layer({
        url: Redacted.make(process.env.DATABASE_URL!),
      }),
    ),
  );
}

type DBExecutor = DBApi | DBTransaction;

type RepoShape<T> = {
  [K in keyof T]: T[K] extends RepoFn<any, any, any, any> ? T[K] : never;
};

type RawRepo<T extends RepoShape<T>> = {
  [K in keyof T]: T[K] extends RepoFn<infer I, infer A, infer E, infer R>
    ? (input: I, db: DBExecutor) => Effect.Effect<A, E, R>
    : never;
};

export function repo<T extends RepoShape<T>>(db: DBApi, raw: RawRepo<T>): T {
  const out: Partial<Record<keyof T, unknown>> = {};

  for (const key of Object.keys(raw) as Array<keyof T>) {
    const fn = raw[key] as RawRepo<T>[typeof key];

    out[key] = (input: unknown, tx?: DBTransaction) => fn(input, tx ?? db);
  }

  return out as T;
}
