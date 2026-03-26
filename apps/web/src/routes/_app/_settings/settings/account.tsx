import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_settings/settings/account')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/settings/account"!</div>;
}
