import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema";

export const makeDrizzle = (url: string) =>
  drizzle({ connection: url, schema });

export type DB = ReturnType<typeof makeDrizzle>;
