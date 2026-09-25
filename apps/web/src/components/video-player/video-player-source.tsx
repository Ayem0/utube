import { useVideoSource } from '@/hooks/use-video-source';
import type { VideoSource } from '@repo/video-player/types';

export function VideoPlayerSource({
  source,
  defaultTime,
}: {
  source: VideoSource;
  defaultTime: number;
}) {
  useVideoSource({ source, defaultTime });
  return null;
}
