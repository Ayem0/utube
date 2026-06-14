import { Data } from "effect";

export class UnauthorizedError extends Data.TaggedError("Unauthorized")<{
  readonly message: string;
}> {}
