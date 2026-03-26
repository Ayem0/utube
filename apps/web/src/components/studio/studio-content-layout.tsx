import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import {
  useLocation,
  useRouteContext,
  useRouter,
} from '@tanstack/react-router';

export function StudioContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { channel } = useRouteContext({ from: '/_studio/studio/$channelId' });
  const router = useRouter();
  const location = useLocation();
  const defaultLocation =
    location.pathname.split('?')[0].split('/').pop() || 'videos';
  return (
    <div className="flex flex-col size-full">
      <Tabs value={defaultLocation}>
        <TabsList variant="line">
          <TabsTrigger
            value="videos"
            onClick={() =>
              router.navigate({
                to: '/studio/$channelId/content/videos',
                params: { channelId: channel.id },
              })
            }
          >
            Videos
          </TabsTrigger>
          <TabsTrigger
            value="playlists"
            onClick={() =>
              router.navigate({
                to: '/studio/$channelId/content/playlists',
                params: { channelId: channel.id },
              })
            }
          >
            Playlists
          </TabsTrigger>
        </TabsList>
        <TabsContent value="videos">{children}</TabsContent>
        <TabsContent value="playlists">{children}</TabsContent>
      </Tabs>
    </div>
  );
}
