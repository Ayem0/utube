import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings/account')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/settings/account"!</div>;
}
