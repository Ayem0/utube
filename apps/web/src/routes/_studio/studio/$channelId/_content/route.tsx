import { StudioContentLayout } from '@/components/studio/studio-content-layout';
import { createFileRoute, Outlet } from '@tanstack/react-router';

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
