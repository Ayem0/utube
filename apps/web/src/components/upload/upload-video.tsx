import { useAppForm } from '@/hooks/use-form';
import { getApi } from '@/lib/api/api';
import { uploadToS3 } from '@/lib/s3/upload-to-s3';
import {
  videoVisibility,
  type VideoVisibility,
} from '@repo/types/enums/video/video-visibility';
import {
  videoPutSchema,
  type VideoPutSchema,
} from '@repo/types/schemas/video-upload';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { FieldGroup } from '@repo/ui/components/field';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { AlertCircleIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import z from 'zod';

type UploadedVideoState = {
  videoId: string;
  title: string;
};

export function UploadVideo({ onSuccess }: { onSuccess?: () => void }) {
  const [uploadedVideoState, setUploadedVideoState] =
    useState<UploadedVideoState | null>(null);

  const onUploadSuccess = (data: UploadedVideoState) => {
    setUploadedVideoState(data);
  };

  return (
    <>
      {uploadedVideoState ? (
        <PublishVideoForm
          videoId={uploadedVideoState.videoId}
          defaultTitle={uploadedVideoState.title}
          onSuccess={onSuccess}
        />
      ) : (
        <UploadVideoForm onSuccess={onUploadSuccess} />
      )}
    </>
  );
}

const uploadVideoFormSchema = z.object({
  file: z
    .file()
    .max(5_000_000_000)
    .mime(['video/mp4', 'video/webm', 'video/ogg']),
});

export function UploadVideoForm({
  onSuccess,
}: {
  onSuccess: (data: UploadedVideoState) => void;
}) {
  const { channel } = useRouteContext({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
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
      onSuccess({ videoId: res.data.videoId, title: res.data.title });
    },
  });

  const [error, setError] = useState<string | null>(null);

  const ref = useRef<HTMLInputElement>(null);

  const onButtonClick = () => {
    if (ref.current) ref.current.click();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload video</DialogTitle>
      </DialogHeader>
      <form className="flex flex-col gap-6" id="upload-video-file-form">
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
                <Button
                  type="button"
                  onClick={onButtonClick}
                  disabled={form.state.isSubmitting}
                >
                  Select video file
                </Button>
                <field.FileInput ref={ref} className="hidden" field={field} />
              </>
            )}
          </form.AppField>
        </form.AppForm>
      </form>
    </>
  );
}

const videoPublishSchema = z.object({
  step1: videoPutSchema,
  step2: z.object({
    thumbnail: z
      .file()
      .mime(['image/jpeg', 'image/png', 'image/webp'])
      .max(5_000_000),
  }),
});

export function PublishVideoForm({
  videoId,
  defaultTitle,
  onSuccess,
}: {
  videoId: string;
  defaultTitle: string;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { channel } = useRouteContext({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const videoMutation = useMutation({
    mutationFn: async (value: VideoPutSchema) =>
      await getApi()
        .studio.channels({ channelId: channel.id })
        .videos({ videoId: videoId })
        .put({
          description: value.description,
          title: value.title,
          visibility: value.visibility,
        }),
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
      step1: {
        title: defaultTitle,
        description: undefined as string | undefined,
        visibility: videoVisibility.DRAFT as VideoVisibility,
      },
      step2: {
        thumbnail: undefined as File | undefined,
      },
    },
    validators: {
      onChange: videoPublishSchema,
      onSubmit: videoPublishSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      console.log('FORM SUBIMITTED', formApi.state.isValid);
      setError(null);
      await videoMutation.mutateAsync(value.step1);
    },
  });

  const visibilityOptions: { label: string; value: VideoVisibility }[] = [
    { label: 'Private', value: videoVisibility.PRIVATE },
    { label: 'Unlisted', value: videoVisibility.UNLISTED },
    { label: 'Public', value: videoVisibility.PUBLIC },
    { label: 'Draft', value: videoVisibility.DRAFT },
  ];

  return (
    <form
      className="flex flex-col gap-6"
      id="update-video-form"
      onSubmit={(e) => {
        e.preventDefault();
        console.log('SUBMIT ON FORM');
        console.log('FORM STATE', {
          values: form.state.values,
          isValid: form.state.isValid,
          errors: form.state.errors,
        });

        form.handleSubmit();
      }}
    >
      <FieldGroup>
        {error && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {currentStep === 1 && (
          <form.FormGroup
            name="step1"
            onGroupSubmit={(value) => {
              console.log('STEP 1 SUBMITTED', value.value);
              setCurrentStep((prev) => prev + 1);
            }}
            children={(groupApi) => (
              <FieldGroup>
                <form.AppField name="step1.title">
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
                <form.AppField name="step1.description">
                  {(field) => (
                    <field.Textarea
                      label="Description"
                      placeholder="Description"
                      maxLength={1024}
                      field={field}
                    />
                  )}
                </form.AppField>
                <form.AppField name="step1.visibility">
                  {(field) => (
                    <field.Select
                      label="Visiblity"
                      placeholder="Visibility"
                      defaultValue={videoVisibility.DRAFT}
                      items={visibilityOptions}
                      field={field}
                      required
                    />
                  )}
                </form.AppField>
                <Button
                  type="button"
                  disabled={!groupApi.state.meta.isValid}
                  onClick={groupApi.handleSubmit}
                >
                  Next
                </Button>
              </FieldGroup>
            )}
          />
        )}
        {currentStep === 2 && (
          <form.FormGroup
            name="step2"
            onGroupSubmit={(value) => {
              console.log('STEP 2 SUBMITTED', value);
            }}
            children={(groupApi) => (
              <FieldGroup>
                <form.AppField name="step2.thumbnail">
                  {(field) => (
                    <field.FileInput
                      label="Thumbnail"
                      placeholder="Thumbnail"
                      field={field}
                      required
                    />
                  )}
                </form.AppField>
                <div className="flex items-center justify-end gap-2">
                  <form.AppForm>
                    <form.SubmitButton label="Save" className="order-2" />
                  </form.AppForm>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                  >
                    Back
                  </Button>
                </div>
              </FieldGroup>
            )}
          />
        )}
      </FieldGroup>
    </form>
  );
}
