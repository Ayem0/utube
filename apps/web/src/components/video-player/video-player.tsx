import { getApi } from '@/lib/api/api';
import { PlayerProvider } from '@/lib/video-player/create-player';
import { watchPlayer } from '@/lib/video-player/watch-player';
import { ClientOnly } from '@tanstack/react-router';
import { VideoPlayerControls } from './controls/video-player-controls';
import { VideoPlayerFullscreenButton } from './controls/video-player-fullscreen-button';
import { VideoPlayerPipButton } from './controls/video-player-pip-button';
import { VideoPlayerPlayButton } from './controls/video-player-play-button';
import { VideoPlayerPlayrate } from './controls/video-player-playrate';
import { VideoPlayerQuality } from './controls/video-player-quality';
import { VideoPlayerSettings } from './controls/video-player-settings';
import { VideoPlayerTimeline } from './controls/video-player-timeline';
import { VideoPlayerTimer } from './controls/video-player-timer';
import { VideoPlayerVolume } from './controls/video-player-volume';
import { Video } from './video';
import { VideoPlayerAuthz } from './video-player-auth';
import { VideoPlayerContainer } from './video-player-container';
import { VideoPlayerOverlay } from './video-player-overlay';
import { VideoPlayerSource } from './video-player-source';
import { VTTTrack } from './vtt-track';

export type VideoPlayerProps = {
  videoId: string;
  exp: number;
  token: string;
  hlsMasterUrl: string;
  defaultTime: number;
  storyboardUrl: string;
};

export function VideoPlayer({
  videoId,
  exp,
  token,
  hlsMasterUrl,
  defaultTime,
  storyboardUrl,
}: VideoPlayerProps) {
  const refreshQuery = async () => {
    const res = await getApi().video({ id: videoId }).refresh.get();
    if (!res.data) {
      throw new Error('Failed to refresh token');
    }
    return res.data;
  };
  return (
    <ClientOnly>
      <PlayerProvider player={watchPlayer}>
        <VideoPlayerAuthz exp={exp} token={token} refreshQuery={refreshQuery} />
        <VideoPlayerSource
          source={{ hls: hlsMasterUrl }}
          defaultTime={defaultTime}
        />
        <VideoPlayerContainer>
          <Video>
            <VTTTrack src={storyboardUrl} />
          </Video>
          <VideoPlayerOverlay />
          <VideoPlayerControls>
            <VideoPlayerTimeline />
            <div className="flex flex-row justify-between">
              <div className="flex flex-row gap-2">
                <VideoPlayerPlayButton />
                <VideoPlayerVolume />
                <VideoPlayerTimer />
              </div>
              <div className="flex flex-row gap-2">
                <VideoPlayerSettings>
                  <VideoPlayerPlayrate />
                  <VideoPlayerQuality />
                </VideoPlayerSettings>
                <VideoPlayerPipButton />
                <VideoPlayerFullscreenButton />
              </div>
            </div>
          </VideoPlayerControls>
        </VideoPlayerContainer>
      </PlayerProvider>
    </ClientOnly>
  );
}
