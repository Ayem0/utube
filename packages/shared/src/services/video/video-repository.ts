import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { video as videoTable } from "../../db/schema";
import { UndefinedError } from "../../lib/utils/undefined-error";
import { DBClient } from "../db/db-client";

export class VideoRepository extends Context.Tag("VideoRepository")<
  VideoRepository,
  VideoRepository.Service
>() {}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace VideoRepository {
  export const makeLive = () => ({
    create: (data: {
      id: string;
      userId: string;
      title: string;
      description: string;
      url: string;
      thumbnail: string;
    }) =>
      Effect.gen(function* () {
        const db = yield* DBClient;
        const [res] = yield* db.run((db) =>
          db
            .insert(videoTable)
            .values({
              id: data.id,
              userId: data.userId,
              title: data.title,
              description: data.description,
              url: data.url,
              thumbnail: data.thumbnail,
            })
            .returning(),
        );
        if (!res) {
          return yield* Effect.fail(new UndefinedError({ message: "Error" }));
        }

        return res;
      }),
    delete: (id: string) =>
      Effect.gen(function* () {
        const db = yield* DBClient;
        yield* db.run((db) =>
          db.delete(videoTable).where(eq(videoTable.id, id)),
        );
      }),
  });

  export type Service = ReturnType<typeof makeLive>;
  export const Live = Layer.succeed(
    VideoRepository,
    VideoRepository.makeLive(),
  );
}
