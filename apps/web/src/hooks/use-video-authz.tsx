import { usePlayerApi } from '@/lib/video-player/create-player';
import { authzFeature } from '@repo/video-player/feature/core/authz';
import { useEffect, useRef } from 'react';

export type VideoAuthProps = {
  exp: number;
  token: string;
  refreshToken: () => Promise<{ token: string; exp: number }>;
};

export function useVideoAuthz(props: VideoAuthProps) {
  const authz = usePlayerApi(authzFeature);
  useEffect(() => {
    authz.setToken(props.token);
  }, [authz, props]);

  let timeoutId: number | null = null;

  const refreshAt = useRef(props.exp);

  const schedule = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const delay = Math.max(0, refreshAt.current * 1000 - Date.now() - 60_000);
    timeoutId = window.setTimeout(async () => {
      try {
        const res = await props.refreshToken();

        authz.setToken(res.token);
        refreshAt.current = res.exp;
        schedule();
      } catch (error) {
        console.error('Failed to refresh token', error);
        schedule();
      }
    }, delay);
  };
  useEffect(() => {
    schedule();
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [authz, props]);
}
