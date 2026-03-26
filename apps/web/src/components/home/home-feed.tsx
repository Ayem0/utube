import { HomeCard } from './home-card';

export interface FakeVideo {
  img: string; // url
  id: string;
  title: string;
  src: string;
  channel: {
    name: string;
    id: string;
    img: string; // url
    subscribers: number;
  };
  uploadedAt: number; // timestamp
  views: number;
  duration: number; // milliseconds
}

export function HomeFeed({ videos }: { videos: Array<FakeVideo> }) {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {videos.map((video) => (
        <HomeCard video={video} key={video.id} />
      ))}
    </div>
  );
}
