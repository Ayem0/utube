import { Context, Effect, Layer } from "effect";
import { FSError } from "./file-system-errors";

export interface FileSystemService {
  writeFile: (
    path: string,
    file: Uint8Array,
  ) => Effect.Effect<string, FSError, never>;
  createDirectory: (path: string) => Effect.Effect<string, FSError, never>;
  deleteFile: (path: string) => Effect.Effect<void, FSError, never>;
  deleteDirectory: (path: string) => Effect.Effect<void, FSError, never>;
}

export class FileSystem extends Context.Service<
  FileSystem,
  FileSystemService
>()("FileSystem") {
  static Layer = Layer.succeed(this, {
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
    deleteDirectory: (path) =>
      Effect.tryPromise({
        try: async () => await Bun.$`rm -rf ${path}`,
        catch: (e) => new FSError({ cause: e, message: "FSError" }),
      }),
    createDirectory: (path) =>
      Effect.tryPromise({
        try: async () => {
          await Bun.$`mkdir -p ${path}`;
          return path;
        },
        catch: (e) => new FSError({ cause: e, message: "FSError" }),
      }),
  });
}
