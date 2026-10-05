import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "./schema/relations";

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// export const db = drizzle({
//   client: pool,
//   relations: relations,
// });

export type DB = Awaited<ReturnType<typeof makeDb>>;

export const makeDb = (url: string, max: number = 1) => {
  const client = new Pool({ connectionString: url, max: max });
  return drizzle({
    client: client,
    relations: relations,
  });
};

export * from "pg";
