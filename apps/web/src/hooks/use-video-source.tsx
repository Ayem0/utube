import { usePlayerSource } from '@/lib/video-player/create-player';
import type { VideoSource } from '@repo/video-player/types';
import { useEffect } from 'react';

export function useVideoSource({
  source,
  defaultTime,
}: {
  source: VideoSource;
  defaultTime?: number;
}) {
  const loadSource = usePlayerSource();
  useEffect(() => {
    loadSource(source, { startPosition: defaultTime });
  }, [loadSource, source, defaultTime]);
}
