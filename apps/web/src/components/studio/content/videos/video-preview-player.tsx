import { VideoPlayerControls } from '@/components/video-player/controls/video-player-controls';
import { VideoPlayerFullscreenButton } from '@/components/video-player/controls/video-player-fullscreen-button';
import { VideoPlayerPipButton } from '@/components/video-player/controls/video-player-pip-button';
import { VideoPlayerPlayButton } from '@/components/video-player/controls/video-player-play-button';
import { VideoPlayerPlayrate } from '@/components/video-player/controls/video-player-playrate';
import { VideoPlayerQuality } from '@/components/video-player/controls/video-player-quality';
import { VideoPlayerSettings } from '@/components/video-player/controls/video-player-settings';
import { VideoPlayerTimeline } from '@/components/video-player/controls/video-player-timeline';
import { VideoPlayerTimer } from '@/components/video-player/controls/video-player-timer';
import { VideoPlayerVolume } from '@/components/video-player/controls/video-player-volume';
import { Video } from '@/components/video-player/video';
import { VideoPlayerContainer } from '@/components/video-player/video-player-container';
import { VideoPlayerOverlay } from '@/components/video-player/video-player-overlay';
import { VTTTrack } from '@/components/video-player/vtt-track';
import { PlayerProvider } from '@/lib/video-player/create-player';
import { videoFeatures } from '@repo/video-player/feature/core/video-features';
import { createPlayer } from '@repo/video-player/player/player';
import { ClientOnly } from '@tanstack/react-router';

const videoEditorPlayer = createPlayer({
  features: videoFeatures,
  engineOptions: {
    quality: -1,
  },
  featureOptions: {
    volume: {
      stateArgs: [1, true],
    },
  },
});

export function VideoPreviewPlayer({
  dashUrl,
  hlsUrl,
  storyboardUrl,
}: {
  hlsUrl: string;
  dashUrl: string;
  storyboardUrl: string;
}) {
  return (
    <ClientOnly>
      <PlayerProvider
        player={videoEditorPlayer}
        source={{
          hls: hlsUrl,
          dash: dashUrl,
        }}
      >
        <VideoPlayerContainer>
          <Video>{storyboardUrl && <VTTTrack src={storyboardUrl} />}</Video>
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
