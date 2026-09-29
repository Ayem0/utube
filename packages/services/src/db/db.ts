import { PgClient } from "@effect/sql-pg";
import { relations } from "@repo/db/relations";
import { EffectLogger } from "drizzle-orm/effect-core";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { PgEffectTransaction } from "drizzle-orm/pg-core/effect";
import { Context, Effect, Layer, Option, Redacted } from "effect";
import type { SqlError } from "effect/unstable/sql/SqlError";

const make = PgDrizzle.make({ relations });
type DBApi = Effect.Success<typeof make>;
type Relations = typeof relations;

type DBTransaction = PgEffectTransaction<
  PgDrizzle.EffectPgQueryEffectHKT,
  PgQueryResultHKT,
  Relations
>;

export class DBConfig extends Context.Service<
  DBConfig,
  {
    readonly url: Redacted.Redacted<string>;
  }
>()("DBConfig") {}

const PgClientLayer = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* DBConfig;

    return PgClient.layerFrom(
      PgClient.makeClient({
        url: config.url,
      }),
    );
  }),
);

class DBDrizzle extends Context.Service<DBDrizzle, DBApi>()("DBDrizzle", {
  make: make,
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(EffectLogger.layer),
    Layer.provide(PgDrizzle.DefaultServices),
    Layer.provide(PgClientLayer),
  );
}

class Transaction extends Context.Service<Transaction, DBTransaction>()(
  "Transaction",
) {}

type ExecuteFn = <A, E, R>(
  fn: (db: DBApi | DBTransaction) => Effect.Effect<A, E, R>,
) => Effect.Effect<A, E, R>;

export class DB extends Context.Service<
  DB,
  {
    run: ExecuteFn;
    withTransaction: <A, E, R>(
      eff: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | SqlError, Exclude<R, Transaction>>;
  }
>()("DB", {
  make: Effect.gen(function* () {
    const db = yield* DBDrizzle;

    const run: ExecuteFn = Effect.fnUntraced(function* (cb) {
      const tx = yield* Effect.serviceOption(Transaction);
      if (Option.isSome(tx)) {
        return yield* cb(tx.value);
      }
      return yield* cb(db);
    });
    return {
      run: run,
      withTransaction: (eff) =>
        db.transaction((tx) =>
          eff.pipe(Effect.provideService(Transaction, tx)),
        ),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(DBDrizzle.Layer),
  );
}
