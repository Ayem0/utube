import { UploadVideo } from '@/components/upload/upload-video';
import { Dialog, DialogContent } from '@repo/ui/components/dialog';

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
        {/* <UploadForm
          closeButton={ 
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
          }
          onSuccess={() => onOpenChange(false)}
        /> */}
        <UploadVideo />
      </DialogContent>
    </Dialog>
  );
}
