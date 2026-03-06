import { makeDrizzle } from "./factory";

export const db = makeDrizzle(process.env.DATABASE_URL!);

export type DB = typeof db;
