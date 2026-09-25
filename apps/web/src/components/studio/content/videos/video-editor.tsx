import { useAppForm } from '@/hooks/use-form';
import { getApi } from '@/lib/api/api';
import type { StudioFullVideo } from '@/lib/queries/get-studio-videos';
import { getStudioVideoQueryOptions } from '@/lib/queries/get-studio-videos';
import { useWS } from '@/lib/ws/ws-provider';
import { videoPlaybackStatus } from '@repo/types/enums/video/video-playback-status';
import type { VideoVisibility } from '@repo/types/enums/video/video-visibility';
import { videoVisibility } from '@repo/types/enums/video/video-visibility';
import type { VideoPutSchema } from '@repo/types/schemas/video-upload';
import { videoPutSchema } from '@repo/types/schemas/video-upload';
import { Button } from '@repo/ui/components/button';
import { FieldGroup } from '@repo/ui/components/field';
import { Spinner } from '@repo/ui/components/spinner';
import {
  Stepper,
  StepperContent,
  StepperList,
  StepperTrigger,
} from '@repo/ui/components/stepper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { VideoPreviewPlayer } from './video-preview-player';

export function VideoEditor({ videoId }: { videoId: string }) {
  const { channel } = useRouteContext({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const qc = useQueryClient();
  const { data, isRefetching, error, isLoading, refetch } = useQuery(
    getStudioVideoQueryOptions(channel.id, videoId),
    qc,
  );
  const [currenntTab, setCurrentTab] = useState(0);
  const steps = useMemo(
    () => [
      { label: 'Details', value: 0 },
      { label: 'Video elements', value: 1 },
    ],
    [],
  );
  useEffect(() => {
    console.log('refetching', isRefetching);
  }, [isRefetching]);
  const ws = useWS();
  ws.subscribe('video.upload.updated', async (msg) => {
    console.log(
      "in the component subscribind to wsEvent 'video.upload.updated':",
      msg,
    );
    void refetch();
  });

  return (
    <div className="p-6 flex w-lg flex-col">
      <Stepper value={currenntTab} onValueChange={setCurrentTab}>
        <StepperList>
          {steps.map((t) => (
            <StepperTrigger key={t.value} value={t.value}>
              {t.label}
            </StepperTrigger>
          ))}
        </StepperList>
        {isLoading ? (
          <div className="size-full flex justify-center items-center">
            <Spinner />
          </div>
        ) : data ? (
          <StepperContent value={0} className="flex w-full">
            <div className="flex flex-row w-full gap-6">
              <VideoMetadataForm
                channelId={channel.id}
                videoId={data.id}
                title={data.title}
                description={data.description}
                visibility={data.visibility}
              />
              <VideoPreview
                dashManifestUrl={data.playback?.dashManifestUrl ?? null}
                hlsMasterUrl={data.playback?.hlsMasterUrl ?? null}
                storyboardUrl={data.playback?.storyboardUrl ?? null}
                status={data.playback?.status ?? videoPlaybackStatus.PROCESSING}
              />
            </div>
          </StepperContent>
        ) : null}
      </Stepper>
      <div className="flex w-full items-center justify-end gap-2">
        <div className="flex items-center justify-end gap-2">
          {currenntTab !== 0 && (
            <Button
              type="button"
              onClick={() => setCurrentTab((prev) => prev - 1)}
            >
              Back
            </Button>
          )}
          {currenntTab !== 1 && (
            <Button
              type="button"
              onClick={() => setCurrentTab((prev) => prev + 1)}
            >
              Next
            </Button>
          )}
          {currenntTab === 1 && <Button type="submit">Save</Button>}
        </div>
      </div>
    </div>
  );
}

type VideoMetadataFormProps = Pick<
  StudioFullVideo,
  'title' | 'description' | 'visibility'
> & {
  channelId: string;
  videoId: string;
};

const visibilityOptions: Array<{ label: string; value: VideoVisibility }> = [
  { label: 'Private', value: videoVisibility.PRIVATE },
  { label: 'Unlisted', value: videoVisibility.UNLISTED },
  { label: 'Public', value: videoVisibility.PUBLIC },
];

export function VideoMetadataForm({
  title,
  description,
  visibility,
  channelId,
  videoId,
}: VideoMetadataFormProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: VideoPutSchema) =>
      getApi().studio.channels({ channelId }).videos({ videoId }).put(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['studio-video', channelId, videoId],
      });
    },
  });
  const form = useAppForm({
    defaultValues: {
      title,
      description,
      visibility,
    },
    onSubmit: async ({ value }) => {
      console.log('VIDEOMETADATAFORM', value);
      await mutation.mutateAsync(value);
    },
    validators: {
      onChange: videoPutSchema,
      onSubmit: videoPutSchema,
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="flex w-full">
      <FieldGroup>
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
        <form.AppField name="visibility">
          {(field) => (
            <field.Select
              label="Visiblity"
              placeholder="Visibility"
              defaultValue={
                visibility === videoVisibility.DRAFT ? undefined : visibility
              }
              items={visibilityOptions}
              field={field}
              required
            />
          )}
        </form.AppField>
      </FieldGroup>
    </form>
  );
}

type VideoPreviwProps = NonNullable<StudioFullVideo['playback']>;

export function VideoPreview({
  dashManifestUrl,
  hlsMasterUrl,
  storyboardUrl,
  status,
}: VideoPreviwProps) {
  if (status === videoPlaybackStatus.PROCESSING) {
    return (
      <div className="flex w-full items-center justify-center">
        <Spinner />
      </div>
    );
  } else if (status === videoPlaybackStatus.FAILED) {
    return (
      <div className="flex w-full items-center justify-center flex-col">
        <h1>Video processing failed</h1>
        <div className="flex w-full items-center">
          <Button type="button" variant="secondary">
            Retry
          </Button>
          <Button type="button" variant="outline">
            Select file
          </Button>
        </div>
      </div>
    );
  } else if (
    status === videoPlaybackStatus.READY &&
    dashManifestUrl &&
    hlsMasterUrl &&
    storyboardUrl
  ) {
    return (
      <div className="w-xs">
        <VideoPreviewPlayer
          dashUrl={dashManifestUrl}
          hlsUrl={hlsMasterUrl}
          storyboardUrl={storyboardUrl}
        />
      </div>
    );
  }
  return null;
}
