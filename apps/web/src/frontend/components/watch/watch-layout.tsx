import { Skeleton } from '@repo/ui/skeleton';
import { ClientOnly, Link } from '@tanstack/react-router';
import { Image } from '@unpic/react';
import type { FakeVideo } from '../home/home-feed';
import { VideoPlayer2 } from '../video-player2/video-player2';

export function WatchLayout({ video }: { video: FakeVideo }) {
  return (
    <div className="flex flex-col w-full">
      <ClientOnly
        fallback={<Skeleton className="flex w-full h-[748px] max-h-[748px]" />}
      >
        <VideoPlayer2 src={'/afriquedusud.mp4'} />
      </ClientOnly>

      <div className="flex flex-col w-full p-3 gap-2 pl-2">
        <span className="text-lg">{video.title}</span>
        <div className="flex flex-row">
          <Link to="/channel">
            <Image
              src={video.channel.img}
              layout="fixed"
              className="rounded-full pt-1"
              width={32}
              height={32}
            />
          </Link>
          <div className="flex flex-col gap-2">
            <Link to="/channel">
              <span className="text-muted-foreground hover:text-white">
                {video.channel.name}
              </span>
            </Link>
            <span className="text-muted-foreground">
              {formatSubscribers(video.channel.subscribers)} subscribers
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
