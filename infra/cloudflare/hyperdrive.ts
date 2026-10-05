import * as Cloudflare from "alchemy/Cloudflare";
import { Config, Effect } from "effect";

export const Hyperdrive = Effect.gen(function* () {
  return yield* Cloudflare.Hyperdrive.Connection("pg", {
    origin: {
      scheme: "postgres",
      host: "localhost",
      port: 5432,
      database: "mydb",
      user: "root",
      password: Config.Redacted("DB_PASSWORD"),
    },
    dev: {
      scheme: "postgres",
      host: "localhost",
      port: 5432,
      database: "mydb",
      user: "root",
      password: Config.Redacted("DB_PASSWORD"),
      sslmode: "disable",
    },
    caching: {
      disabled: true,
    },
  });
});
