import { getAuthClient } from '@repo/auth/auth-client';

export const authClient = getAuthClient(import.meta.env.VITE_API_URL!);
