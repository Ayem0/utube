import { Context, Effect, Layer } from "effect";
import { video as videoTable } from "../../db/schema";
import { DB } from "../db/db-service";

export class VideoRepository extends Context.Tag("VideoRepository")<
  VideoRepository,
  VideoRepository.Service
>() {}

export namespace VideoRepository {
  export const makeLive = () => ({
    create: (
      id: string,
      userId: string,
      title: string,
      description: string,
      url: string,
      thumbnail: string,
    ) =>
      Effect.gen(function* () {
        const db = yield* DB;
        const res = yield* db
          .insert(videoTable)
          .values({
            id,
            userId,
            title,
            description,
            url,
            thumbnail,
          })
          .returning();
        return res;
      }),
  });

  export type Service = ReturnType<typeof makeLive>;
  export const Live = Layer.succeed(
    VideoRepository,
    VideoRepository.makeLive(),
  );
}
