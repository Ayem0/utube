import { createAuthClient } from "better-auth/react";

export const getAuthClient = (
  baseUrl: string,
): ReturnType<typeof createAuthClient> =>
  createAuthClient({
    baseURL: baseUrl,
    fetchOptions: {
      credentials: "include",
    },
  });
