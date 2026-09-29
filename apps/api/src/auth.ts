import { makeAuth } from "@repo/auth/auth";
import { makeDb } from "@repo/db";
import Elysia from "elysia";
import { Env } from "./env";

export const authMacro = new Elysia({
  name: "auth",
}).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const db = makeDb(Env.HYPERDRIVE.connectionString, 1);
      const auth = makeAuth(db, Env.BETTER_AUTH_URL, Env.BETTER_AUTH_SECRET, [
        "http://localhost:3000",
      ]);
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
      const db = makeDb(Env.HYPERDRIVE.connectionString, 1);
      const auth = makeAuth(db, Env.BETTER_AUTH_URL, Env.BETTER_AUTH_SECRET, [
        "http://localhost:3000",
      ]);
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
