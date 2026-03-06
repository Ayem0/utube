import type { VideoUploadSchema } from '@/backend/api/video/video';
import { videoUploadSchema } from '@/backend/api/video/video';
import { useAppForm } from '@/frontend/hooks/use-form';
import { getApi } from '@/frontend/routes/api/$';
import { Alert, AlertDescription } from '@repo/ui/alert';
import { FieldGroup } from '@repo/ui/field';
import { AlertCircleIcon } from 'lucide-react';
import { useState } from 'react';

export function UploadForm() {
  const [error, setError] = useState<string | null>(null);
  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
      image: undefined,
      video: undefined,
    } as unknown as VideoUploadSchema,
    validators: {
      onChange: videoUploadSchema,
      onSubmit: videoUploadSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const res = await getApi().video.post(value);
        if (res.status !== 201) {
          setError(
            typeof res.error?.value === 'string'
              ? res.error.value
              : (res.error?.value.message ?? 'Unknown error'),
          );
        }
      } catch (error) {
        setError('Unknown error');
      }
    },
  });

  return (
    <form
      className="flex flex-col gap-6"
      id="product-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Upload</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Upload a video
          </p>
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <form.AppField name="title">
          {(field) => (
            <field.Input
              label="Title"
              placeholder="Title"
              field={field}
              type="text"
              required
              autofocus
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.Textarea
              label="Description"
              placeholder="Description"
              maxLength={1024}
              field={field}
            />
          )}
        </form.AppField>
        <form.AppField name="image">
          {(field) => (
            <field.FileInput
              label="Image"
              placeholder="Image"
              field={field as any}
            />
          )}
        </form.AppField>
        <form.AppField name="video">
          {(field) => (
            <field.FileInput
              label="Video"
              placeholder="Video"
              field={field as any}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Upload" />
        </form.AppForm>
      </FieldGroup>
    </form>
  );
}
