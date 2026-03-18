import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema";

export const makeDrizzle = (connectionString: string) => {
  const sql = new SQL({
    adapter: "postgres",
    url: connectionString,
    max: 10,
  });
  return drizzle({
    client: sql,
    schema: schema,
  });
};
