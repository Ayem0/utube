import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui/components/empty';
import { FilePlay } from 'lucide-react';

export function VideoTableEmpty({
  createComponent,
}: {
  createComponent?: React.ReactNode;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FilePlay />
        </EmptyMedia>
        <EmptyTitle>No Videos Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t uploaded any videos yet. Get started by uploading
          your first video.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        {createComponent}
      </EmptyContent>
    </Empty>
  );
}
