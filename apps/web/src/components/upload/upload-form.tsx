import { useAppForm } from '@/hooks/use-form';
import { getApi } from '@/lib/api/api';
import type { VideoUploadSchema } from '@repo/shared/types/video/video-upload-schema';
import { videoUploadSchema } from '@repo/shared/types/video/video-upload-schema';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { FieldGroup } from '@repo/ui/components/field';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { AlertCircleIcon } from 'lucide-react';
import { useState } from 'react';

export function UploadForm({
  closeButton,
  onSuccess,
}: {
  closeButton?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { channel } = useRouteContext({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const queryClient = useQueryClient();

  const videoMutation = useMutation({
    mutationFn: async (value: VideoUploadSchema) =>
      await getApi().video.post(value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'studio-videos' &&
          query.queryKey[1] === channel.id,
      });
      onSuccess?.();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const form = useAppForm({
    defaultValues: {
      channelId: channel.id,
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
      await videoMutation.mutateAsync(value);
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
        {/* <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Upload</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Upload a video
          </p>
        </div> */}
        {error && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
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
        <div className="flex items-center justify-end gap-2">
          <form.AppForm>
            <form.SubmitButton label="Upload" className="order-2" />
          </form.AppForm>
          {closeButton}
        </div>
      </FieldGroup>
    </form>
  );
}
