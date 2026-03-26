import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { UploadForm } from '../../upload/upload-form';

export function VideoTableDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // triggerRender: React.ReactElement;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* <DialogTrigger render={triggerRender} /> */}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Upload video</DialogTitle>
          <DialogDescription>Upload a video to your channel.</DialogDescription>
        </DialogHeader>
        <UploadForm
          closeButton={
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
          }
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
