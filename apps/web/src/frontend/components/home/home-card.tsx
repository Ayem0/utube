import { formatDuration } from '@/frontend/lib/utils/format-duration';
import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Link, useRouter } from '@tanstack/react-router';
import { Image } from '@unpic/react';
import { FastAverageColor } from 'fast-average-color';
import { EllipsisVertical } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FakeVideo } from './home-feed';

// TODO compute the average color of the thumbnail server side, and add it in the FakeVideo type
export function HomeCard({ video }: { video: FakeVideo }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    const fac = new FastAverageColor();

    const setColor = () => {
      const color = fac.getColor(img, { algorithm: 'simple', mode: 'speed' });
      container.style.setProperty('--fac-color', color.rgba);
    };
    if (img.complete) {
      setColor();
    } else {
      img.addEventListener('load', setColor);
    }
    return () => {
      img.removeEventListener('load', setColor);
    };
  }, []);
  return (
    <div
      className="flex flex-col rounded-lg hover:bg-(--fac-color)/20 transition-colors duration-200 cursor-pointer"
      ref={containerRef}
      key={video.id}
      onClick={() =>
        router.navigate({ to: '/watch/$id', params: { id: video.id } })
      }
    >
      <Link to="/watch/$id" params={{ id: video.id }}>
        <div className="relative p-2">
          <Image
            ref={imgRef}
            src={video.img}
            layout="fullWidth"
            className="rounded-lg"
            crossOrigin="anonymous"
          />
          <div className="absolute bottom-3 right-3 bg-black/50 rounded-sm px-1">
            <span>{formatDuration(video.duration)}</span>
          </div>
        </div>
      </Link>

      <div className="flex flex-row w-full">
        <div className="flex flex-row px-2 pb-2 w-full">
          <Link
            to="/@{$id}"
            params={{ id: video.channel.id }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={video.channel.img}
              layout="fixed"
              className="rounded-full pt-1"
              width={32}
              height={32}
            />
          </Link>

          <div className="flex flex-col pl-2">
            <h3>
              <Link to="/watch/$id" params={{ id: video.id }}>
                <span className="align-text-top">{video.title}</span>
              </Link>
            </h3>
            <div className="text-muted-foreground">
              <Link
                to="/@{$id}"
                params={{ id: video.channel.id }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-muted-foreground hover:text-white">
                  {video.channel.name}
                </span>
              </Link>
            </div>
            <div className="text-muted-foreground gap-2 flex">
              <span className="text-nowrap">
                {formatViews(video.views)} views
              </span>
              <span>.</span>
              <span>{formatUploadedAt(video.uploadedAt)}</span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => {
              e.stopPropagation();
            }}
            render={
              <Button
                variant="ghost"
                className="rounded-full size-9 hover:bg-(--fac-color)/50! aria-expanded:bg-transparent"
              />
            }
          >
            <EllipsisVertical className="size-7" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

const units = [
  { name: 'year', seconds: 86400 * 365 },
  { name: 'month', seconds: 86400 * 7 * 4 },
  { name: 'week', seconds: 86400 * 7 },
  { name: 'day', seconds: 86400 },
  { name: 'hour', seconds: 3600 },
  { name: 'minute', seconds: 60 },
  { name: 'second', seconds: 1 },
];

function formatUploadedAt(ts: number) {
  const diffSeconds = Math.floor((Date.now() - ts) / 1000);
  for (const unit of units) {
    if (diffSeconds >= unit.seconds) {
      const value = Math.floor(diffSeconds / unit.seconds);
      return `${value} ${unit.name}${value === 1 ? '' : 's'} ago`;
    }
  }
  return '0 seconds ago';
}

function formatViews(views: number) {
  if (views > 1_000_000_000) return `${Math.floor(views / 1_000_000_000)} Md`;
  if (views > 1_000_000) return `${Math.floor(views / 1_000_000)} M`;
  if (views > 1_000) return `${Math.floor(views / 1000)} k`;
  return `${views}`;
}
