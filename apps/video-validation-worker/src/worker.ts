import {
  VideoValidationJob,
  videoValidationJob,
} from "@repo/shared/lib/queues/video-validation-job";
import { S3Client, S3ClientLive } from "@repo/shared/services/s3/s3-client";
import { Worker } from "bullmq";
import { Effect } from "effect";
import { InvalidVideoError, WriteFileError } from "./errors";

const MAX_PIXEL_WIDTH = 3840;
const MAX_PIXEL_HEIGHT = 2160;
const MAX_FPS = 60;
const MAX_DURATION_SECONDS = 12 * 60 * 60;

console.log("REDIS URL", process.env.REDIS_URL);

new Worker(
  "videoValidationQueue",
  async (job) => {
    const payload = videoValidationJob.parse(job.data);
    await Effect.runPromise(
      program(payload).pipe(
        Effect.provide(S3ClientLive),
        Effect.match({
          onFailure: (e) => {
            console.log("FAILURE");
            console.log(e);
            return Effect.succeed(e);
          },
          onSuccess: () => {
            // update db
            console.log("Success");
          },
        }),
      ),
    );
  },
  {
    connection: {
      url: process.env.REDIS_URL,
    },
  },
);

const program = (data: VideoValidationJob) =>
  Effect.gen(function* () {
    const s3client = yield* S3Client;

    console.log("DATA", data);
    const video = yield* s3client.getFile(data.payload.videoId, "temp-video");

    const tmpPath = `/tmp/${data.payload.videoId}`;

    yield* Effect.tryPromise({
      try: async () => {
        await Bun.write(tmpPath, video);
      },
      catch: (e) => new WriteFileError({ cause: e }),
    });

    const proc = Bun.spawn(
      [
        "ffprobe",
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        tmpPath,
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const output = yield* Effect.tryPromise({
      try: async () => {
        const text = await new Response(proc.stdout).text();
        return JSON.parse(text);
      },
      catch: (e) =>
        new InvalidVideoError({
          cause: e,
          message: "Error reading file metadata",
        }),
    });

    console.log("OUTPUT", output);

    // 3️⃣ Extract video stream
    const videoStream = output.streams.find(
      (s: any) => s.codec_type === "video",
    );

    if (!videoStream) {
      return yield* new InvalidVideoError({
        cause: "No video stream found",
        message: "No video stream found",
      });
    }

    const width = videoStream.width;
    const height = videoStream.height;

    // fps comes as "30000/1001"
    const fpsParts = videoStream.r_frame_rate.split("/");
    const fps = Number(fpsParts[0]) / Number(fpsParts[1]);

    const duration = Number(output.format.duration);

    // 4️⃣ Validate constraints
    if (width > MAX_PIXEL_WIDTH || height > MAX_PIXEL_HEIGHT) {
      return yield* new InvalidVideoError({
        cause: "Resolution too high",
        message: `Resolution too high: ${width}x${height}`,
      });
    }

    if (fps > MAX_FPS) {
      return yield* new InvalidVideoError({
        cause: "FPS too high",
        message: `FPS too high: ${fps}`,
      });
    }

    if (duration > MAX_DURATION_SECONDS) {
      return yield* new InvalidVideoError({
        cause: "Duration too long",
        message: `Duration too long: ${duration}s`,
      });
    }
    return;
  });
console.log("Worker started. Listening for jobs on videoValidationQueue...");
