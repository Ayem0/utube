import { Data } from "effect";

export class S3Error extends Data.TaggedError("S3Error")<{
  readonly message: string;
  readonly cause: unknown;
}> {}
