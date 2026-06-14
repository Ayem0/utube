import { PgClient } from "@effect/sql-pg";
import { relations } from "@repo/db/relations";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { Context, Effect, Layer, Redacted } from "effect";

// TODO : benchmark bunsqlclient vs node pg client
const make = PgDrizzle.make({ relations });

export class DB extends Context.Service<DB, Effect.Success<typeof make>>()(
  "DB",
  {
    make: make,
  },
) {
  static readonly Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PgDrizzle.DefaultServices),
    Layer.provide(
      PgClient.layer({
        url: Redacted.make(process.env.DATABASE_URL!),
      }),
    ),
  );
}
