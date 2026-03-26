import { db } from "@repo/db";
import { channel } from "@repo/db/schema";
import { generateRandomNameFromEmail } from "@repo/shared/lib/utils/name-generator";
import { redisClient } from "@repo/shared/redis/redis";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days cache duration
      strategy: "jwe", // can be "jwt" or "compact"
      // refreshCache: true, // Enable stateless refresh
    },
  },
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
  account: {
    storeStateStrategy: "cookie",
  },
  secondaryStorage: {
    get: async (key) => await redisClient.get(key),
    set: async (key, value, ttl) => {
      if (ttl) return await redisClient.set(key, value, "EX", ttl);
      return await redisClient.set(key, value);
    },
    delete: async (key) => {
      await redisClient.del(key);
    },
  },
  plugins: [jwt(), tanstackStartCookies()],
  baseURL: process.env.VITE_BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const generatedName = generateRandomNameFromEmail(user.email);
          await db.insert(channel).values({
            id: crypto.randomUUID(),
            default: true,
            name: generatedName,
            alias: generatedName,
            image: user.image,
            userId: user.id,
          });
        },
      },
    },
  },
});
