import { useEffect, useState } from 'react';
import { useVideoPlayer } from '../providers/video-player-provider';

export function VideoPlayerQualitySwitcher() {
  const videoPlayer = useVideoPlayer();
  const [qualities, setQualities] = useState<
    Array<{ index: number; height: number; frameRate: number }>
  >([]);
  useEffect(() => {
    videoPlayer.on('qualitiesLoaded', setQualities);
    return () => {
      videoPlayer.off('qualitiesLoaded', setQualities);
    };
  }, []);
  return (
    <div className="flex w-full flex-col">
      <h1>Quality Switcher</h1>
      <ul>
        {qualities.map((quality) => (
          <li key={quality.index}>
            <button onClick={() => videoPlayer.setQuality(quality.index)}>
              {quality.height}p {quality.frameRate === 60 ? '60fps' : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
