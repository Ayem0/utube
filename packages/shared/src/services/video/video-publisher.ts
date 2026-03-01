import { Context, Effect, Exit, Layer } from "effect";
import { FileStorage } from "../file-storage/file-storage";
import { MediaValidator } from "../media/media-validator";
import { VideoRepository } from "./video-repository";

export class VideoPublisher extends Context.Tag("VideoPublisher")<
  VideoPublisher,
  VideoPublisher.Service
>() {}

export namespace VideoPublisher {
  export const makeLive = () => ({
    publishVideo: (
      userId: string,
      title: string,
      description: string,
      image: File,
      video: File,
    ) =>
      Effect.scoped(
        Effect.gen(function* () {
          const videoRepo = yield* VideoRepository;
          const fileStorage = yield* FileStorage;
          const mediaValidator = yield* MediaValidator;
          const id = crypto.randomUUID();
          const videoId = `${id}-video`;
          const imageId = `${id}-image`;

          yield* mediaValidator.validateImage(image);

          yield* Effect.acquireRelease(
            fileStorage.uploadFile(videoId, video),
            (_, exit) =>
              Exit.isFailure(exit)
                ? fileStorage.deleteFile(videoId).pipe(
                    Effect.catchAll((e) => {
                      console.log(e);
                      return Effect.void;
                    }),
                  )
                : Effect.void,
          );

          yield* Effect.acquireRelease(
            fileStorage.uploadFile(imageId, image),
            (_, exit) =>
              Exit.isFailure(exit)
                ? fileStorage.deleteFile(imageId).pipe(
                    Effect.catchAll((e) => {
                      console.log(e);
                      return Effect.void;
                    }),
                  )
                : Effect.void,
          );

          const created = yield* videoRepo.create(
            id,
            userId,
            title,
            description,
            imageId,
            videoId,
          );
          return created;
        }),
      ),
  });

  export type Service = ReturnType<typeof makeLive>;
  export const Live = Layer.succeed(VideoPublisher, VideoPublisher.makeLive());
}
