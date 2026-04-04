import { DB, makeDrizzle } from "@repo/db";
import { Context, Effect, Layer } from "effect";
import { DBError } from "./db-errors";

export interface DBClientService {
  run: <T>(fn: (db: DB) => Promise<T>) => Effect.Effect<T, DBError>;
}

export class DBClient extends Context.Tag("DBClient")<
  DBClient,
  DBClientService
>() {}

export const DBClientLive = Layer.scoped(
  DBClient,
  Effect.gen(function* () {
    const db = yield* Effect.acquireRelease(
      Effect.sync(() => makeDrizzle(process.env.DATABASE_URL!)),
      (db) =>
        Effect.promise(async () => {
          await db.$client.close();
        }),
    );

    return {
      run: <T>(f: (d: typeof db) => Promise<T>) =>
        Effect.tryPromise({
          try: () => f(db),
          catch: (e) => new DBError({ message: "DBError", cause: e }),
        }).pipe(Effect.retry({ times: 3 })),
    };
  }),
);
