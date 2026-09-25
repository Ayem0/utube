import { useAppForm } from '@/hooks/use-form';
import { getApi } from '@/lib/api/api';
import { uploadToS3 } from '@/lib/s3/upload-to-s3';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { useRouteContext, useRouter } from '@tanstack/react-router';
import { AlertCircleIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import z from 'zod';

const uploadVideoFormSchema = z.object({
  file: z
    .file()
    .max(5_000_000_000)
    .mime(['video/mp4', 'video/webm', 'video/ogg']),
});

export function VideoUploadForm() {
  const { channel } = useRouteContext({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const router = useRouter();
  const form = useAppForm({
    defaultValues: {
      file: undefined as File | undefined,
    },
    validators: {
      onChange: uploadVideoFormSchema,
      onSubmit: uploadVideoFormSchema,
    },
    listeners: {
      onChange: async ({ fieldApi, formApi }) => {
        if (fieldApi.name !== 'file') return;
        if (!formApi.state.values.file) return;

        // Avoid double submits
        if (formApi.state.isSubmitting) return;

        if (formApi.state.isValid) {
          await formApi.handleSubmit();
        }
      },
    },
    onSubmit: async ({ value }) => {
      if (!value.file) return;
      const res = await getApi()
        .studio.channels({ channelId: channel.id })
        .videos.post({
          filename: value.file.name,
          mimeType: value.file.type,
          sizeBytes: value.file.size,
        });
      if (res.error) {
        setError(
          typeof res.error.value === 'string'
            ? res.error.value
            : (res.error.value.message ?? 'Something went wrong, try again.'),
        );
        return;
      }

      try {
        await uploadToS3(value.file, res.data.presignedUrl);
      } catch (error) {
        console.log('THE ERROR', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to upload file, try again.',
        );
        return;
      }
      router.navigate({
        to: '/studio/$channelId/content/videos',
        params: { channelId: channel.id },
        search: (prev) => ({ ...prev, videoId: res.data.videoId }),
      });
    },
  });

  const [error, setError] = useState<string | null>(null);

  const ref = useRef<HTMLInputElement>(null);

  const onButtonClick = () => {
    if (ref.current) ref.current.click();
  };

  return (
    <div className="w-xs md:w-lg gap-4 h-150">
      <DialogHeader className="border-b py-4 px-6">
        <DialogTitle>Upload video</DialogTitle>
      </DialogHeader>
      <form
        className="flex h-full w-full justify-center items-center"
        id="upload-video-file-form"
      >
        {error && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form.AppForm>
          <form.AppField name="file">
            {(field) => (
              <div className="flex ">
                <Button
                  className="w-40"
                  type="button"
                  onClick={onButtonClick}
                  disabled={form.state.isSubmitting}
                >
                  Select video file
                </Button>
                <field.FileInput ref={ref} className="hidden" field={field} />
              </div>
            )}
          </form.AppField>
        </form.AppForm>
      </form>
    </div>
  );
}
