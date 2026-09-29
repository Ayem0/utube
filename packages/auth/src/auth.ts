import { type DB } from "@repo/db";
import { channel, schema } from "@repo/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// export const auth = betterAuth({
//   database: drizzleAdapter(db, {
//     provider: "pg",
//     schema: schema,
//   }),
//   emailAndPassword: {
//     enabled: true,
//     autoSignIn: true,
//   },
//   session: {
//     cookieCache: {
//       enabled: true,
//       maxAge: 7 * 24 * 60 * 60, // 7 days cache duration
//       strategy: "jwe", // can be "jwt" or "compact"
//       // refreshCache: true, // Enable stateless refresh
//     },
//   },
//   trustedOrigins: ["http://localhost:3000", "http://localhost:8787"],
//   account: {
//     storeStateStrategy: "cookie",
//   },
//   plugins: [jwt()],
//   baseURL: process.env.BETTER_AUTH_URL!,
//   secret: process.env.BETTER_AUTH_SECRET!,
//   databaseHooks: {
//     user: {
//       create: {
//         after: async (user) => {
//           const generatedName = generateRandomNameFromEmail(user.email);
//           await db.insert(channel).values({
//             default: true,
//             name: generatedName,
//             alias: generatedName,
//             userId: user.id,
//           });
//         },
//       },
//     },
//   },
// });

function generateRandomNameFromEmail(email: string) {
  const p1 = email.split("@")[0] ?? "user";

  const base = p1
    .replace(/[^\p{L}\p{N}]+/gu, "") // extract only letters and numbers
    .toLowerCase()
    .slice(0, 20);

  const suffix = randomSuffix();

  return base + suffix;
}

const alphabet =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" as const;

function randomSuffix(length: number = 6) {
  const buffer = new Uint8Array(length);
  const num = crypto.getRandomValues(buffer);

  let out = "";
  for (const n of num) {
    out += alphabet[n % alphabet.length];
  }
  return out;
}

export const makeAuth = (db: DB, baseUrl: string, secret: string, trustedOrigins: string[]) =>
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
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
    trustedOrigins: trustedOrigins,
    account: {
      storeStateStrategy: "cookie",
    },
    plugins: [],
    baseURL: baseUrl,
    secret: secret,
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const generatedName = generateRandomNameFromEmail(user.email);
            await db.insert(channel).values({
              default: true,
              name: generatedName,
              alias: generatedName,
              userId: user.id,
            });
          },
        },
      },
    },
  });
