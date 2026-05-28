import { player } from '@/lib/video-player/player';
import { useEffect, useRef } from 'react';

export function VTTTrack({ src }: { src: string }) {
  const ref = useRef<HTMLTrackElement>(null);
  const storyboardApi = player.usePlayerApi('storyboard');

  useEffect(() => {
    if (!ref.current) return;
    storyboardApi.attachTrack(ref.current);
    return () => storyboardApi.detachTrack();
  });

  return (
    <track src={src} label="thumbnails" ref={ref} kind="metadata" default />
  );
}
