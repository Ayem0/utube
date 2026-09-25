import { usePlayerApi } from '@/lib/video-player/create-player';
import { storyboardFeature } from '@repo/video-player/feature/core/storyboard';
import { useEffect, useRef } from 'react';

export function VTTTrack({ src }: { src: string }) {
  const ref = useRef<HTMLTrackElement>(null);
  const storyboardApi = usePlayerApi(storyboardFeature);

  useEffect(() => {
    if (!ref.current) return;
    storyboardApi.attachTrack(ref.current, src);
    return () => storyboardApi.detachTrack();
  }, []);

  return <track label="thumbnails" ref={ref} kind="metadata" />;
}
