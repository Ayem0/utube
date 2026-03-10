import { Context, Effect, Layer } from "effect";
import { FSError } from "./file-system-errors";

export interface FileSystemService {
  writeFile: (
    path: string,
    file: Bun.S3File,
  ) => Effect.Effect<string, FSError, never>;
  deleteFile: (path: string) => Effect.Effect<void, FSError, never>;
}

export class FileSystem extends Context.Tag("FileSystem")<
  FileSystem,
  FileSystemService
>() {}

const makeLive: () => FileSystemService = () => ({
  writeFile: (path, file) =>
    Effect.tryPromise({
      try: async () => {
        await Bun.write(path, file);
        return path;
      },
      catch: (e) => new FSError({ cause: e, message: "FSError" }),
    }),
  deleteFile: (path) =>
    Effect.tryPromise({
      try: async () => await Bun.file(path).delete(),
      catch: (e) => new FSError({ cause: e, message: "FSError" }),
    }),
});

export const FileSystemLive = Layer.succeed(FileSystem, makeLive());
