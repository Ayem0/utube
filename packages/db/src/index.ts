import { drizzle } from "drizzle-orm/bun-sql";
import { relations } from "./schema/relations";

export const makeDrizzle = (url: string) =>
  drizzle({
    connection: url,
    relations: relations,
  });

export type DB = ReturnType<typeof makeDrizzle>;
