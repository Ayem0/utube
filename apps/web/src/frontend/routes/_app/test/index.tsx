import { createFileRoute } from '@tanstack/react-router';
import { getApi } from '../../api/$';

export const Route = createFileRoute('/_app/test/')({
  component: RouteComponent,
  loader: () =>
    getApi()
      .get()
      .then((res) => res.data),
});

function RouteComponent() {
  const msg = Route.useLoaderData();
  return <div>{msg}</div>;
}
