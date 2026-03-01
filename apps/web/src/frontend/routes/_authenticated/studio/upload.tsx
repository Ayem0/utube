import { UploadForm } from '@/frontend/components/upload/upload-form';
import { authMiddleware } from '@/frontend/middleware/auth-middleware';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/studio/upload')({
  component: RouteComponent,
  server: {
    middleware: [authMiddleware],
  },
});

function RouteComponent() {
  return (
    <div className="">
      <UploadForm />
    </div>
  );
}
