import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_channel/@{$alias}/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { alias } = Route.useParams();
  if (!alias) return <div>Not found</div>;
  return <div>Hello "/_app/_channel/@$id/"!</div>;
}
