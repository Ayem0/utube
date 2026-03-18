import { Effect } from "effect";
import { FileSystemService } from "../file-system/file-system";

export const withTempVideoFile = (
  fs: FileSystemService,
  videoId: string,
  buffer: Bun.S3File,
) =>
  Effect.acquireRelease(fs.writeFile(`/tmp/${videoId}`, buffer), (path) =>
    fs.deleteFile(path).pipe(Effect.catchAll(() => Effect.void)),
  );
