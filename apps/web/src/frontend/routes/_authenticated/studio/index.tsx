import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/studio/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="">
      <div>Hello "/_authenticated/studio/"!</div>
      <Link to="/studio/upload">Upload</Link>
    </div>
  );
}
