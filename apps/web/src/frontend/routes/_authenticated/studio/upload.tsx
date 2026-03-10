import { UploadForm } from '@/frontend/components/upload/upload-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/studio/upload')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="">
      <UploadForm />
    </div>
  );
}
