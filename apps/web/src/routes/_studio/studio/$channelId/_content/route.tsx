import { Outlet, createFileRoute } from '@tanstack/react-router';
import { StudioContentLayout } from '@/components/studio/studio-content-layout';

export const Route = createFileRoute('/_studio/studio/$channelId/_content')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <StudioContentLayout>
      <Outlet />
    </StudioContentLayout>
  );
}
