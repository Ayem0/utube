import { Data } from 'effect';

export class DBError extends Data.TaggedError('DBError')<{
  readonly message: string;
}> {}
