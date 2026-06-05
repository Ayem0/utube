import { useAppForm } from '@/hooks/use-form';
import { getApi } from '@/lib/api/api';
import { uploadToS3 } from '@/lib/s3/upload-to-s3';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { useRouteContext } from '@tanstack/react-router';
import { AlertCircleIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import z from 'zod';

export function UploadVideo() {
  const [isUploaded, setIsUploaded] = useState(false);

  return isUploaded ? (
    <>Uploaded</>
  ) : (
    <UploadVideoFile onSuccess={() => setIsUploaded(true)} />
  );
}

const uploadVideoFileSchema = z.object({
  file: z.file().max(5_000_000_000).mime(['video/mp4', 'video/webm']),
});

export function UploadVideoFile({ onSuccess }: { onSuccess: () => void }) {
  const { channel } = useRouteContext({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const form = useAppForm({
    defaultValues: {
      file: undefined as File | undefined,
    },
    validators: {
      onChange: uploadVideoFileSchema,
      onSubmit: uploadVideoFileSchema,
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
      const res = await getApi().video['upload-video'].post({
        channelId: channel.id,
        fileName: value.file.name,
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
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to upload file, try again.',
        );
        return;
      }

      const res2 = await getApi().video['uploaded-video'].post({
        videoId: res.data.videoId,
      });

      if (res2.error) {
        setError(
          typeof res2.error.value === 'string'
            ? res2.error.value
            : (res2.error.value.message ?? 'Something went wrong, try again.'),
        );
        return;
      } else {
        console.log('SUCCESFULLY UPLOADED THE FILE');
        onSuccess();
      }
    },
  });

  const [error, setError] = useState<string | null>(null);

  const ref = useRef<HTMLInputElement>(null);

  const onButtonClick = () => {
    if (ref.current) ref.current.click();
  };

  return (
    <div className="flex size-full items-center justify-center min-w-80 min-h-80">
      <form
        className="flex flex-col gap-6"
        id="upload-video-file-form"
        // onSubmit={(e) => {
        //   e.preventDefault();
        //   form.handleSubmit();
        // }}
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
              <>
                <Button type="button" onClick={onButtonClick}>
                  Select video file
                </Button>
                <field.FileInput ref={ref} className="hidden" field={field} />
              </>
            )}
          </form.AppField>
        </form.AppForm>
      </form>
    </div>
  );
}
