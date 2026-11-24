import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "./schema/relations";

export type DB = ReturnType<typeof makeDb>;

export const makeDb = (url: string, max: number = 1) => {
  const client = new Pool({ connectionString: url, max: max });
  return drizzle({
    client: client,
    relations: relations,
  });
};

export * from "pg";
