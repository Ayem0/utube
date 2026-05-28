import { drizzle } from "drizzle-orm/bun-sql";
import { BunRedisCache } from "./cache";
import * as schema from "./schema";

export const makeDrizzle = (url: string) =>
  drizzle({
    connection: url,
    schema,
    cache: new BunRedisCache({
      defaultTtl: 300,
      prefix: "drizzle:cache",
      strategy: "explicit",
      url: process.env.REDIS_URL,
    }),
  });

export type DB = ReturnType<typeof makeDrizzle>;
