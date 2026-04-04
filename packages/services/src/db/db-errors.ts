import { Data } from "effect";

export class DBError extends Data.TaggedError("DBError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class DBNotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly message: string;
}> {}
