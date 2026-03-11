import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_channel/@{$id}/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  if (!id) return <div>Not found</div>;
  return <div>Hello "/_app/_channel/@$id/"!</div>;
}
