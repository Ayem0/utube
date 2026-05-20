import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Check the cwd and where .env/.env.local are located.",
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
