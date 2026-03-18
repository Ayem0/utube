import { SignupForm } from '@/frontend/components/auth/signup-form';
import { HomeLink } from '@/frontend/components/header/home-link';
import { createFileRoute, redirect } from '@tanstack/react-router';
import z from 'zod';

const searchSchema = z.object({
  redirectUrl: z.string().default('/'),
});

export const Route = createFileRoute('/_auth/signup')({
  component: RouteComponent,
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ context, search }) => {
    if (context.user) throw redirect({ to: search.redirectUrl });
  },
});

function RouteComponent() {
  return (
    <div className="grid min-h-svh">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <HomeLink />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
