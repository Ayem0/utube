import { useVideoAuthz, type VideoAuthProps } from '@/hooks/use-video-authz';

export function VideoPlayerAuthz(props: VideoAuthProps) {
  useVideoAuthz(props);
  return null;
}
