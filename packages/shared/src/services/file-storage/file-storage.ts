import { Context, Effect } from "effect";
import { FSError } from "./file-storage-errors";

export interface FileStorageService {
  uploadFile: (id: string, image: File) => Effect.Effect<void, FSError, never>;
  deleteFile: (id: string) => Effect.Effect<void, FSError, never>;
}

export class FileStorage extends Context.Tag("FileStorage")<
  FileStorage,
  FileStorageService
>() {}
