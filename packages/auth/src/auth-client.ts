import { createAuthClient } from "better-auth/react";

const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL!,
});
export default authClient;
