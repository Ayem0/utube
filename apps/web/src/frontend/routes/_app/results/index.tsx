import { createFileRoute, stripSearchParams } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/results/')({
  validateSearch: (sp: Record<string, unknown>) => {
    return {
      q: sp.q ? String(sp.q) : '',
    };
  },
  search: {
    middlewares: [
      stripSearchParams({
        q: '',
      }),
    ],
  },

  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex size-full justify-center items-center flex-col gap-2">
      <div className="text-2xl font-medium">No result found</div>
      <div className="text text-muted-foreground">
        Try others keywords or remove search filters.
      </div>
    </div>
  );
}
