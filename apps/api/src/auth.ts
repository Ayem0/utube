import { makeAuth } from "@repo/auth/auth";
import { makeDb } from "@repo/db";
import { env } from "cloudflare:workers";
import Elysia from "elysia";

export const authMacro = new Elysia({
  name: "auth",
}).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const db = makeDb(env.HYPERDRIVE.connectionString, 1);
      const auth = makeAuth(db, env.BETTER_AUTH_URL, env.BETTER_AUTH_SECRET);
      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        return status(401);
      }

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
  optionalAuth: {
    async resolve({ request: { headers } }) {
      const db = makeDb(env.HYPERDRIVE.connectionString, 1);
      const auth = makeAuth(db, env.BETTER_AUTH_URL, env.BETTER_AUTH_SECRET);
      const session = await auth.api.getSession({
        headers,
      });

      return {
        user: session?.user,
        session: session?.session,
      };
    },
  },
});
