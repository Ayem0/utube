import { Dialog, DialogContent } from '@repo/ui/components/dialog';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { VideoUploadForm } from './videos/video-upload-form';
import { VideoEditor } from '@/components/studio/content/videos/video-editor';

export function VideoTableDialog() {
  const navigate = useNavigate({ from: '/studio/$channelId/content/videos' });
  const { videoId, up } = useSearch({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const close = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        videoId: undefined,
        up: false,
      }),
    });
  };
  const open = !!videoId || up;
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (open) return;
        close();
      }}
    >
      <DialogContent
        className="w-auto max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl p-0"
        closeButtonClassName="top-2.5"
      >
        {videoId ? (
          <VideoEditor videoId={videoId} />
        ) : up ? (
          <VideoUploadForm />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
