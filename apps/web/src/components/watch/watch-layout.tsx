import type { WatchVideo } from '@/lib/queries/get-watch-video';
import { Link } from '@tanstack/react-router';
import { VideoPlayer } from '../video-player/video-player';

export function WatchLayout({
  video,
  defaultTime,
}: {
  video: WatchVideo;
  defaultTime: number;
}) {
  return (
    <div className="flex flex-col w-full">
      <VideoPlayer
        defaultTime={defaultTime}
        exp={video.exp}
        hlsMasterUrl={video.hlsMasterUrl}
        storyboardUrl={video.storyboardUrl}
        token={video.token}
        videoId={video.id}
      />

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
