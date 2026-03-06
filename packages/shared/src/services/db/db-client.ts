// db/layer.ts
import { Context, Effect, Layer } from "effect";
import { DB } from "../../db";
import { makeDrizzle } from "../../db/factory";
import { DBError } from "./db-errors";

export interface DBClientService {
  run: <T>(fn: (db: DB) => Promise<T>) => Effect.Effect<T, DBError, never>;
}

export class DBClient extends Context.Tag("DBClient")<
  DBClient,
  DBClientService
>() {}

const makeLive = () =>
  Effect.gen(function* () {
    const db = yield* Effect.acquireRelease(
      Effect.sync(() => makeDrizzle(process.env.DATABASE_URL!)),
      (db) =>
        Effect.promise(async () => {
          await db.$client.close();
        }),
    );

    return {
      run: <A>(f: (d: typeof db) => Promise<A>) =>
        Effect.tryPromise({
          try: () => f(db),
          catch: (e) =>
            new DBError({ message: typeof e === "string" ? e : "DBError" }),
        }).pipe(Effect.retry({ times: 3 })),
    };
  });

export const DBClientLive = Layer.scoped(DBClient, makeLive());
