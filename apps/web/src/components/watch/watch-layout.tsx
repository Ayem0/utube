import type { WatchVideo } from '@/lib/queries/get-watch-video';
import { player } from '@/lib/video-player/player';
import { ClientOnly, Link } from '@tanstack/react-router';
import { VideoPlayerControls } from '../video-player/controls/video-player-controls';
import { VideoPlayerFullscreenButton } from '../video-player/controls/video-player-fullscreen-button';
import { VideoPlayerPipButton } from '../video-player/controls/video-player-pip-button';
import { VideoPlayerPlayButton } from '../video-player/controls/video-player-play-button';
import { VideoPlayerPlayrate } from '../video-player/controls/video-player-playrate';
import { VideoPlayerQuality } from '../video-player/controls/video-player-quality';
import { VideoPlayerSettings } from '../video-player/controls/video-player-settings';
import { VideoPlayerTimeline } from '../video-player/controls/video-player-timeline';
import { VideoPlayerTimer } from '../video-player/controls/video-player-timer';
import { VideoPlayerVolume } from '../video-player/controls/video-player-volume';
import { Video } from '../video-player/video';
import { VideoPlayerContainer } from '../video-player/video-player-container';
import { VideoPlayerOverlay } from '../video-player/video-player-overlay';
import { VTTTrack } from '../video-player/VTT-track';

export function WatchLayout({
  video,
  defaultTime,
}: {
  video: WatchVideo;
  defaultTime: number;
}) {
  return (
    <div className="flex flex-col w-full">
      <ClientOnly>
        <player.Provider
          source={{
            hls: video.hlsUrl,
            dash: video.dashUrl,
          }}
          defaultTime={defaultTime}
        >
          <VideoPlayerContainer>
            <Video>
              <VTTTrack src={video.storyboardUrl} />
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
        </player.Provider>
      </ClientOnly>

      <div className="flex flex-col w-full p-3 gap-2 pl-2">
        <span className="text-lg">{video.title}</span>
        <div className="flex flex-row">
          <Link to="/@{$alias}" params={{ alias: video.channel.alias }}>
            {/* <Image
              src={video.channel.avatarUrl ?? ''}
              layout="fixed"
              className="rounded-full pt-1"
              width={32}
              height={32}
            /> */}
          </Link>
          <div className="flex flex-col gap-2">
            <Link to="/@{$alias}" params={{ alias: video.channel.alias }}>
              <span className="text-muted-foreground hover:text-white">
                {video.channel.name}
              </span>
            </Link>
            <span className="text-muted-foreground">
              {formatSubscribers(0)} subscribers
              {/* TODO add subscribers */}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatSubscribers(subscribers: number) {
  if (subscribers >= 1_000_000_000)
    return `${Math.floor(subscribers / 1_000_000_000)} Md`;
  if (subscribers >= 1_000_000)
    return `${Math.floor(subscribers / 1_000_000)} M`;
  if (subscribers >= 1_000) return `${Math.floor(subscribers / 1000)} k`;
  return `${subscribers}`;
}
