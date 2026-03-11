import { FakeVideo, HomeFeed } from '@/frontend/components/home/home-feed';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/')({ component: App });

const videos: FakeVideo[] = [
  {
    id: '1',
    img: 'https://picsum.photos/seed/video1/800/450',
    title: 'Modern Web Development with React and TypeScript',
    channel: {
      id: 'c1',
      name: 'CodeCraft',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeCraft',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 3600000 * 2,
    views: 12500,
    duration: 646,
    src: '/afriquedusud.mp4',
  },
  {
    id: '2',
    img: 'https://picsum.photos/seed/video2/800/450',
    title: 'Top 10 Hidden Places to Visit in Europe 2024',
    channel: {
      id: 'c2',
      name: 'Wanderlust',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wanderlust',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 3600000 * 24,
    views: 89000,
    duration: 1240,
    src: '/afriquedusud.mp4',
  },
  {
    id: '3',
    img: 'https://picsum.photos/seed/video3/800/450',
    title: 'The Future of Artificial General Intelligence',
    channel: {
      id: 'c3',
      name: 'TechInsight',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechInsight',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 3600000 * 5,
    views: 450000,
    duration: 1800,
    src: '/afriquedusud.mp4',
  },
  {
    id: '4',
    img: 'https://picsum.photos/seed/video4/800/450',
    title: 'Perfect Homemade Pizza - Better than Delivery!',
    channel: {
      id: 'c4',
      name: 'ChefLife',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefLife',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 3600000 * 48,
    views: 32000,
    duration: 900,
    src: '/afriquedusud.mp4',
  },
  {
    id: '5',
    img: 'https://picsum.photos/seed/video5/800/450',
    title: 'Why Rust is the Most Loved Language',
    channel: {
      id: 'c5',
      name: 'SystemPros',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SystemPros',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 86400000 * 3,
    views: 150000,
    duration: 720,
    src: '/afriquedusud.mp4',
  },
  {
    id: '6',
    img: 'https://picsum.photos/seed/video6/800/450',
    title: 'Street Food Tour in Bangkok - Spicy & Delicious',
    channel: {
      id: 'c6',
      name: 'FlavorHunter',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FlavorHunter',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 86400000 * 7,
    views: 280000,
    duration: 1500,
    src: '/afriquedusud.mp4',
  },
  {
    id: '7',
    img: 'https://picsum.photos/seed/video7/800/450',
    title: 'DIY Smart Home Automation on a Budget',
    channel: {
      id: 'c7',
      name: 'MakerSpace',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MakerSpace',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 86400000 * 10,
    views: 45000,
    duration: 1100,
    src: '/afriquedusud.mp4',
  },
  {
    id: '8',
    img: 'https://picsum.photos/seed/video8/800/450',
    title: 'Life in a Tiny House - 1 Year In',
    channel: {
      id: 'c8',
      name: 'SmallLiving',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SmallLiving',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 86400000 * 14,
    views: 1200000,
    duration: 2100,
    src: '/afriquedusud.mp4',
  },
  {
    id: '9',
    img: 'https://picsum.photos/seed/video9/800/450',
    title: 'Learning Photography: The Exposure Triangle',
    channel: {
      id: 'c9',
      name: 'LensFocus',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LensFocus',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 3600000 * 12,
    views: 75000,
    duration: 840,
    src: '/afriquedusud.mp4',
  },
  {
    id: '10',
    img: 'https://picsum.photos/seed/video10/800/450',
    title: 'Extreme Mountain Biking in British Columbia',
    channel: {
      id: 'c10',
      name: 'AdrenalineJunkie',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdrenalineJunkie',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 86400000 * 5,
    views: 210000,
    duration: 1320,
    src: '/afriquedusud.mp4',
  },
  {
    id: '11',
    img: 'https://picsum.photos/seed/video11/800/450',
    title: 'Space Exploration: The Next 50 Years',
    channel: {
      id: 'c11',
      name: 'CosmosDaily',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CosmosDaily',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 86400000 * 2,
    views: 95000,
    duration: 2400,
    src: '/afriquedusud.mp4',
  },
  {
    id: '12',
    img: 'https://picsum.photos/seed/video12/800/450',
    title: 'Piano Covers of Top 2023 Hits',
    channel: {
      id: 'c12',
      name: 'IvoryKeys',
      img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=IvoryKeys',
      subscribers: 1000000,
    },
    uploadedAt: Date.now() - 86400000 * 30,
    views: 3400000,
    duration: 3600,
    src: '/afriquedusud.mp4',
  },
];

function App() {
  return (
    <div className="flex flex-col w-full">
      <HomeFeed videos={videos} />
    </div>
  );
}
