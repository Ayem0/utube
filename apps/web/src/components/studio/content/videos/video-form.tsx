import { useAppForm, withForm } from '@/hooks/use-form';
import { getApi } from '@/lib/api/api';
import {
  getStudioVideoQueryOptions,
  type StudioFullVideo,
} from '@/lib/queries/get-studio-videos';
import { uploadToS3 } from '@/lib/s3/upload-to-s3';
import { assetType } from '@repo/types/enums/asset/asset-type';
import {
  videoVisibility,
  type VideoVisibility,
} from '@repo/types/enums/video/video-visibility';
import { Button } from '@repo/ui/components/button';
import { FieldGroup } from '@repo/ui/components/field';
import { Spinner } from '@repo/ui/components/spinner';
import {
  Stepper,
  StepperContent,
  StepperList,
  StepperTrigger,
} from '@repo/ui/components/stepper';
import { formOptions, type AnyFormGroupApi } from '@tanstack/react-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

const formSchema = z.object({
  step1: z.object({
    title: z.string().min(1, 'Title is required').max(128, 'Title is too long'),
    description: z.string().max(1024, 'Description is too long').nullable(),
    visibility: z.enum(videoVisibility),
  }),
  step2: z.object({
    thumbnail: z
      .file()
      .max(2_000_000, 'File is too big')
      .mime(['image/png', 'image/jpeg', 'image/webp']),
  }),
});

const formOpts = formOptions({
  defaultValues: {
    step1: {
      title: '',
      description: null as string | null,
      visibility: videoVisibility.DRAFT as VideoVisibility,
    },
    step2: {
      thumbnail: undefined as File | undefined,
    },
  },
  validators: {
    onSubmit: formSchema,
    onChange: formSchema,
  },
});

export function VideoFormDialog({ videoId }: { videoId: string }) {
  const qc = useQueryClient();
  const { channel } = useRouteContext({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const { data, isLoading } = useQuery(
    getStudioVideoQueryOptions({
      channelId: channel.id,
      videoId: videoId,
    }),
  );

  return (
    <div className="flex size-full p-6 min-w-xs">
      {isLoading ? (
        <div className="size-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : data ? (
        <VideoForm channelId={channel.id} videoId={videoId} video={data} />
      ) : null}
    </div>
  );
}

export function VideoForm({
  video,
  videoId,
  channelId,
}: {
  videoId: string;
  channelId: string;
  video: StudioFullVideo;
}) {
  const form = useAppForm({
    ...formOpts,
    defaultValues: {
      step1: {
        title: video.title,
        description: video.description,
        visibility: video.visibility,
      },
      step2: {
        thumbnail: undefined as File | undefined,
      },
    },
    onSubmit: ({}) => {
      console.log('in the form submit');
    },
  });
  const steps = useMemo(
    () =>
      [
        { label: 'Details', value: 0 },
        { label: 'Video elements', value: 1 },
      ] as const,
    [],
  );
  const [step, setStep] = useState<(typeof steps)[number]['value']>(0);

  const content = (step: (typeof steps)[number]['value']) => (
    <StepperContent value={step}>
      {step === 0 ? (
        <MetadataForm
          form={form}
          onGroupSubmit={() => setStep(1)}
          renderChild={(group) => (
            <Button type="submit" onClick={group.handleSubmit}>
              Next
            </Button>
          )}
        />
      ) : (
        <ThumbnailForm
          channelId={channelId}
          videoId={videoId}
          form={form}
          renderChild={(group) => (
            <Button type="submit" onClick={group.handleSubmit}>
              Next
            </Button>
          )}
        />
      )}
    </StepperContent>
  );

  return (
    <form onSubmit={form.handleSubmit}>
      <Stepper value={step} onValueChange={setStep}>
        <StepperList>
          {steps.map((step) => (
            <StepperTrigger key={step.value} value={step.value}>
              {step.label}
            </StepperTrigger>
          ))}
        </StepperList>
        {content(step)}
      </Stepper>
    </form>
  );
}

const visibilityOptions: Array<{ label: string; value: VideoVisibility }> = [
  { label: 'Private', value: videoVisibility.PRIVATE },
  { label: 'Unlisted', value: videoVisibility.UNLISTED },
  { label: 'Public', value: videoVisibility.PUBLIC },
];

const MetadataForm = withForm({
  ...formOpts,
  props: {
    onGroupSubmit: () => {},
    renderChild: (group: AnyFormGroupApi) => ({}) as ReactNode,
  },
  render: ({ form, renderChild, onGroupSubmit }) => {
    return (
      <form.FormGroup
        name="step1"
        onGroupSubmit={({ value }) => {
          console.log('Step1 values:', value);
          onGroupSubmit();
        }}
        children={(group) => (
          <>
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
                    items={visibilityOptions}
                    field={field}
                    required
                  />
                )}
              </form.AppField>
            </FieldGroup>
            {renderChild(group)}
          </>
        )}
      />
    );
  },
});

const ThumbnailForm = withForm({
  ...formOpts,
  props: {
    videoId: '',
    channelId: '',
    renderChild: (group: AnyFormGroupApi) => ({}) as ReactNode,
  },
  render: ({ form, videoId, channelId }) => {
    const ref = useRef<HTMLInputElement>(null);

    const onButtonClick = () => {
      if (ref.current) ref.current.click();
    };

    return (
      <form.FormGroup
        name="step2"
        listeners={{
          onChange: async ({ groupApi, value }) => {
            console.log('in the onchange');
            if (groupApi.state.meta.isSubmitting) return;
            if (!value.thumbnail) return;

            await groupApi.handleSubmit();
          },
        }}
        onGroupSubmit={async ({ value, groupApi }) => {
          console.log(
            'in the ongroupsubmit',
            value.thumbnail,
            groupApi.state.meta.isSubmitting,
          );
          if (!value.thumbnail) return;
          const res = await getApi()
            .studio.channels({ channelId })
            .videos({ videoId })
            .assets.post({
              mimeType: value.thumbnail.type,
              sizeBytes: value.thumbnail.size,
              type: assetType.VIDEO_THUMBNAIL,
            });
          if (!res.data) {
            // set error
            return;
          }

          try {
            await uploadToS3(value.thumbnail, res.data.url);
          } catch (error) {
            // set error
          }
        }}
        children={(group) => (
          <form.AppField name="step2.thumbnail">
            {(field) => (
              <div className="flex">
                <Button
                  className="w-40"
                  type="button"
                  onClick={onButtonClick}
                  disabled={group.state.meta.isSubmitting}
                >
                  Select thumbnail
                </Button>
                <field.FileInput ref={ref} className="hidden" field={field} />
              </div>
            )}
          </form.AppField>
        )}
      />
    );
  },
});
