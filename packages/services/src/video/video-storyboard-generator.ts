import { Context, Effect, Layer } from "effect";
import { VideoStoryboardError } from "./video-errors";
import {
  VideoStoryboardConfig,
  VideoStoryboardConfigService,
} from "./video-storyboard-config";

interface VideoStoryboardGeneratorService {
  generate: (
    originalPath: string,
    rowId: string,
    duration: number,
  ) => Effect.Effect<
    { key: string; file: Bun.BunFile }[],
    VideoStoryboardError
  >;
}

export class VideoStoryboardGenerator extends Context.Tag(
  "VideoStoryboardGenerator",
)<VideoStoryboardGenerator, VideoStoryboardGeneratorService>() {}

export const VideoStoryboardGeneratorLive = Layer.effect(
  VideoStoryboardGenerator,
  Effect.gen(function* () {
    const cfg = yield* VideoStoryboardConfig;
    return {
      generate: (originalPath, rowId, duration) =>
        Effect.tryPromise({
          try: async () => {
            console.log("Generating storyboard for", rowId);
            const outputDir = `/tmp/${rowId}`;

            const storyboardArgs = buildStoryboardArgs(
              originalPath,
              outputDir,
              duration,
              cfg,
            );
            const storyboardProc = Bun.spawn(storyboardArgs, {
              stdout: "pipe",
              stderr: "pipe",
            });
            const storyboardExit = await storyboardProc.exited;
            if (storyboardExit !== 0) {
              const stderr = await new Response(storyboardProc.stderr).text();
              throw new Error(
                `ffmpeg exited with code ${storyboardExit}: ${stderr}`,
              );
            }

            await generateStoryboardVTTFile(outputDir, duration, rowId, cfg);
            const paths = await Array.fromAsync(
              new Bun.Glob("**/storyboard*.*").scan(outputDir),
            );
            const entries = paths.map((path) => ({
              key: `${rowId}/${path.split("/").pop()}`,
              file: Bun.file(`${outputDir}/${path}`),
            }));
            console.log("Generated storyboard", entries.length, "entries");
            return entries;
          },
          catch: (e) =>
            new VideoStoryboardError({
              cause: e,
              message: "Error generating storyboard",
            }),
        }),
    };
  }),
);

function getStoryboardInterval(
  duration: number,
  cfg: VideoStoryboardConfigService,
) {
  if (duration < cfg.SHORT_VIDEO_MAX_SECONDS) {
    return cfg.SHORT_VIDEO_STORYBOARD_INTERVAL_SECONDS;
  } else if (duration < cfg.MEDIUM_VIDEO_MAX_SECONDS) {
    return cfg.MEDIUM_VIDEO_STORYBOARD_INTERVAL_SECONDS;
  } else if (duration < cfg.LONG_VIDEO_MAX_SECONDS) {
    return cfg.LONG_VIDEO_STORYBOARD_INTERVAL_SECONDS;
  } else {
    return cfg.VERYLONG_VIDEO_STORYBOARD_INTERVAL_SECONDS;
  }
}

async function generateStoryboardVTTFile(
  outputDir: string,
  duration: number,
  rowId: string,
  cfg: VideoStoryboardConfigService,
) {
  const storyboardInterval = getStoryboardInterval(duration, cfg);
  const thumbsPerSheet = cfg.STORYBOARD_TILE_COLS * cfg.STORYBOARD_TILE_ROWS;
  const totalThumbs = Math.ceil(duration / storyboardInterval);

  const lines: string[] = ["WEBVTT", ""];

  for (let i = 0; i < totalThumbs; i++) {
    const start = i * storyboardInterval;
    const end = Math.min((i + 1) * storyboardInterval, duration);

    const sheetIndex = Math.floor(i / thumbsPerSheet);
    const indexInSheet = i % thumbsPerSheet;

    const col = indexInSheet % cfg.STORYBOARD_TILE_COLS;
    const row = Math.floor(indexInSheet / cfg.STORYBOARD_TILE_COLS);

    const x = col * cfg.STORYBOARD_WIDTH;
    const y = row * cfg.STORYBOARD_HEIGHT;

    const sheetNumber = sheetIndex + 1;

    // TODO : replace with .env config for url
    const baseUrl = `http://localhost:8080/videos/${rowId}`;

    lines.push(
      `${toVttTimestamp(start)} --> ${toVttTimestamp(end)}`,
      `${baseUrl}/storyboard_${String(sheetNumber).padStart(3, "0")}.jpg#xywh=${x},${y},${cfg.STORYBOARD_WIDTH},${cfg.STORYBOARD_HEIGHT}`,
      "",
    );
  }

  await Bun.write(`${outputDir}/storyboard.vtt`, lines.join("\n"));
}

// TODO : Look if json could be super cool to improve performance over VTT files
// function generateStoryboardJSON(
//   duration: number,
//   rowId: string,
//   cfg: VideoStoryboardConfigService,
// ) {

// }

function toVttTimestamp(totalSeconds: number) {
  const ms = Math.floor((totalSeconds % 1) * 1000);
  const s = Math.floor(totalSeconds) % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function buildStoryboardArgs(
  inputPath: string,
  outputDir: string,
  duration: number,
  cfg: VideoStoryboardConfigService,
) {
  const interval = getStoryboardInterval(duration, cfg);
  const vf = [
    `fps=1/${interval}`,
    `scale=${cfg.STORYBOARD_WIDTH}:${cfg.STORYBOARD_HEIGHT}:force_original_aspect_ratio=decrease`,
    `pad=${cfg.STORYBOARD_WIDTH}:${cfg.STORYBOARD_HEIGHT}:(ow-iw)/2:(oh-ih)/2`,
    `tile=${cfg.STORYBOARD_TILE_COLS}x${cfg.STORYBOARD_TILE_ROWS}:nb_frames=${cfg.STORYBOARD_TILE_COLS * cfg.STORYBOARD_TILE_ROWS}`,
  ];
  return [
    "ffmpeg",
    "-y",
    "-i",
    inputPath,
    "-vf",
    vf.join(","),
    "-fps_mode",
    "passthrough",
    "-f",
    "image2",
    "-c:v",
    "mjpeg",
    "-q:v",
    "3",
    `${outputDir}/storyboard_%03d.jpg`,
  ];
}
