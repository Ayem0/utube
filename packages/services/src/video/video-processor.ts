import { Context, Effect, Layer, Stream } from "effect";
import { VideoMetadata } from "./video";
import { VideoProcessingError } from "./video-errors";
import {
  VideoProcessorConfig,
  VideoProcessorConfigService,
} from "./video-processor-config";

import { FileSystem } from "effect/FileSystem";
import { ChildProcess } from "effect/process";
import type { ChildProcessSpawner } from "effect/process/ChildProcessSpawner";
import type { Scope } from "effect/Scope";

interface VideoProcessorService {
  transcode: (params: {
    originalPath: string;
    outputDir: string;
    videoMetadata: VideoMetadata;
    parsedFPS: number;
  }) => Effect.Effect<
    LadderEntry[],
    VideoProcessingError,
    ChildProcessSpawner | Scope
  >;
}

export class VideoProcessor extends Context.Service<
  VideoProcessor,
  VideoProcessorService
>()("VideoProcessor", {
  make: Effect.gen(function* () {
    const config = yield* VideoProcessorConfig;
    const fs = yield* FileSystem;

    const makeDirectories = (dirs: string[]) =>
      Effect.forEach(
        dirs,
        (dir) =>
          fs.makeDirectory(dir, {
            recursive: true,
          }),
        { concurrency: "unbounded" },
      );

    return {
      transcode: ({ originalPath, outputDir, videoMetadata, parsedFPS }) =>
        Effect.gen(function* () {
          const { args, ladder, hasAudio } = buildFfmpegArgs({
            inputPath: originalPath,
            outputDir,
            metadata: videoMetadata,
            parsedFPS,
            config,
          });

          yield* Effect.log("Ladder:", ladder);

          yield* makeDirectories([
            `${outputDir}/cmaf`,
            `${outputDir}/hls`,
            `${outputDir}/dash`,
            ...ladder.map(
              (entry) => `${outputDir}/cmaf/${entry.representationId}`,
            ),
            ...(hasAudio ? [`${outputDir}/cmaf/${ladder.length}`] : []),
          ]);

          const spawn = yield* ChildProcess.make("ffmpeg", args, {
            stderr: "pipe",
            stdout: "pipe",
          });

          const [exitCode, stderr] = yield* Effect.all(
            [
              spawn.exitCode,
              spawn.stderr.pipe(Stream.decodeText, Stream.mkString),
            ],
            { concurrency: "unbounded" },
          );

          if (exitCode !== 0)
            return yield* new VideoProcessingError({
              cause: stderr,
              message: `Ffmpeg exited with code : ${exitCode}`,
            });

          const master = yield* fs.readFileString(
            `${outputDir}/hls/master.m3u8.tmp2`,
          );
          const patched = addFrameRateToMasterM3u8(master, ladder);
          yield* fs.writeFileString(`${outputDir}/hls/master.m3u8`, patched);

          return ladder;
        }).pipe(
          Effect.catchTag(
            "PlatformError",
            (e) =>
              new VideoProcessingError({
                cause: e,
                message: "Video processing error",
              }),
          ),
        ),
    };
  }),
}) {
  static Layer = Layer.effect(this, this.make).pipe(
    Layer.provide(VideoProcessorConfig.Layer),
  );
}

type LadderEntry = {
  height: number;
  width: number;
  fps: 30 | 60;
  bitrate: string;
  maxrate: string;
  bufsize: string;
  level: string;
  label:
    | "144p"
    | "240p"
    | "360p"
    | "480p"
    | "720p"
    | "720p60"
    | "1080p"
    | "1080p60"
    | "1440p"
    | "1440p60"
    | "2160p"
    | "2160p60";
};

const ABR_LADDER: LadderEntry[] = [
  {
    height: 2160,
    width: 3840,
    fps: 60,
    bitrate: "48M",
    maxrate: "72M",
    bufsize: "96M",
    level: "5.2",
    label: "2160p60",
  },
  {
    height: 2160,
    width: 3840,
    fps: 30,
    bitrate: "32M",
    maxrate: "48M",
    bufsize: "64M",
    level: "5.1",
    label: "2160p",
  },
  {
    height: 1440,
    width: 2560,
    fps: 60,
    bitrate: "24M",
    maxrate: "32M",
    bufsize: "48M",
    level: "5.1",
    label: "1440p60",
  },
  {
    height: 1440,
    width: 2560,
    fps: 30,
    bitrate: "16M",
    maxrate: "24M",
    bufsize: "32M",
    level: "5.0",
    label: "1440p",
  },
  {
    height: 1080,
    width: 1920,
    fps: 60,
    bitrate: "12M",
    maxrate: "18M",
    bufsize: "24M",
    level: "4.2",
    label: "1080p60",
  },
  {
    height: 1080,
    width: 1920,
    fps: 30,
    bitrate: "8M",
    maxrate: "12M",
    bufsize: "16M",
    level: "4.1",
    label: "1080p",
  },
  {
    height: 720,
    width: 1280,
    fps: 60,
    bitrate: "8M",
    maxrate: "12M",
    bufsize: "16M",
    level: "4.0",
    label: "720p60",
  },
  {
    height: 720,
    width: 1280,
    fps: 30,
    bitrate: "5M",
    maxrate: "8M",
    bufsize: "10M",
    level: "3.1",
    label: "720p",
  },
  {
    height: 480,
    width: 854,
    fps: 30,
    bitrate: "2.5M",
    maxrate: "4M",
    bufsize: "5M",
    level: "3.0",
    label: "480p",
  },
  {
    height: 360,
    width: 640,
    fps: 30,
    bitrate: "1M",
    maxrate: "1.5M",
    bufsize: "2M",
    level: "3.0",
    label: "360p",
  },
  {
    height: 240,
    width: 426,
    fps: 30,
    bitrate: "400k",
    maxrate: "500k",
    bufsize: "1M",
    level: "3.0",
    label: "240p",
  },
  {
    height: 144,
    width: 256,
    fps: 30,
    bitrate: "200k",
    maxrate: "300k",
    bufsize: "500k",
    level: "3.0",
    label: "144p",
  },
] as const;

function buildLadder(
  inputHeight: number,
  inputFPS: number,
): (LadderEntry & { representationId: string })[] {
  const maxFPS: 30 | 60 = inputFPS > 50 ? 60 : 30;

  return ABR_LADDER.filter(
    (r) => inputHeight >= r.height && (maxFPS === r.fps || r.height <= 480),
  ).map((r, i) => ({
    ...r,
    representationId: String(i),
  }));
}

function getVideoStream(metadata: VideoMetadata) {
  return metadata.streams?.find((s) => s.codec_type === "video");
}

function getRotation(metadata: VideoMetadata) {
  const videoStream = getVideoStream(metadata);
  const rotation =
    videoStream?.tags?.rotate ??
    videoStream?.side_data_list?.find((sd) => sd.rotation != null)?.rotation ??
    0;

  return typeof rotation === "string" ? Number(rotation) : rotation;
}

function getEffectiveDimensions(metadata: VideoMetadata) {
  const videoStream = getVideoStream(metadata);
  const width = videoStream?.width;
  const height = videoStream?.height;

  if (!width || !height) {
    throw new Error("No width or height found");
  }

  const rotation = getRotation(metadata);
  const isRotated = rotation === 90 || rotation === 270;

  return isRotated ? { width: height, height: width } : { width, height };
}

function buildNormalizationFilters(metadata: VideoMetadata) {
  // const vfArr: string[] = ["yadif"];
  const vfArr: string[] = [];

  const rotation = getRotation(metadata);
  switch (rotation) {
    case 90:
      vfArr.push("transpose=1");
      break;
    case 180:
      vfArr.push("hflip,vflip");
      break;
    case 270:
      vfArr.push("transpose=2");
      break;
  }

  const isHDR =
    metadata.streams?.some((s) => s.color_space === "bt2020") ||
    metadata.streams?.some((s) => s.color_primaries === "bt2020") ||
    metadata.streams?.some((s) => s.color_transfer === "smpte2084") ||
    metadata.streams?.some((s) => s.color_transfer === "arib-std-b67");

  if (isHDR) {
    vfArr.push("zscale=t=linear:npl=100");
    vfArr.push("tonemap=hable");
    vfArr.push("zscale=t=bt709");
  }

  // Cap normalization to 4K before building the ladder.
  vfArr.push("scale='min(3840,iw)':-2:flags=lanczos");

  return vfArr.join(",");
}

function buildFfmpegArgs({
  inputPath,
  outputDir,
  metadata,
  parsedFPS,
  config,
}: {
  inputPath: string;
  outputDir: string;
  metadata: VideoMetadata;
  parsedFPS: number;
  config: VideoProcessorConfigService;
}) {
  const { height, width } = getEffectiveDimensions(metadata);
  const ladder = buildLadder(height, parsedFPS);

  if (ladder.length === 0) {
    throw new Error("No valid ABR ladder could be generated");
  }

  const normalizeFilters = buildNormalizationFilters(metadata);
  const splitLabels = ladder.map((_, i) => `[s${i}]`).join("");

  const filterComplexParts: string[] = [
    `[0:v]${normalizeFilters},split=${ladder.length}${splitLabels}`,
    ...ladder.map(
      (row, i) =>
        `[s${i}]scale=-2:${row.height}:flags=lanczos,setdar=${width}/${height},fps=${row.fps}[v${i}]`,
    ),
  ];

  const filterComplex = filterComplexParts.join(";");

  const videoArgs = ladder.flatMap((row, i) => {
    // const gop = row.fps * config.SEGMENT_DURATION_SECONDS;
    const gop = row.fps;
    const profile = row.height >= 720 ? "high" : "main";

    return [
      "-map",
      `[v${i}]`,
      `-threads:v:${i}`,
      "2",
      `-c:v:${i}`,
      "libx264",
      `-b:v:${i}`,
      row.bitrate,
      `-maxrate:v:${i}`,
      row.maxrate,
      `-bufsize:v:${i}`,
      row.bufsize,
      `-g:v:${i}`,
      String(gop),
      `-keyint_min:v:${i}`,
      String(gop),
      `-profile:v:${i}`,
      profile,
      `-level:v:${i}`,
      row.level,
      `-pix_fmt:v:${i}`,
      "yuv420p",
      `-x264-params:v:${i}`,
      "ref=2:bframes=2:b-pyramid=none:weightp=1:rc-lookahead=10:force-cfr=1",
    ];
  });

  const hasAudio =
    metadata.streams?.some((s) => s.codec_type === "audio") ?? false;

  const audioArgs = hasAudio
    ? ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "128k", "-ac", "2"]
    : [];

  const args = [
    // "ffmpeg",
    "-y",
    "-i",
    inputPath,
    "-map_metadata",
    "-1",
    "-fflags",
    "+genpts",
    "-filter_complex",
    filterComplex,
    "-filter_complex_threads",
    "2",
    ...videoArgs,
    ...audioArgs,
    "-preset",
    "veryfast",
    "-tune",
    "fastdecode",
    "-sc_threshold",
    "0",
    // "-movflags",
    // "+faststart",
    // "+cmaf",
    "-flags",
    "+cgop",
    // "-force_key_frames",
    // "-force_key_frames",
    // `expr:gte(t,n_forced*30)`,
    // `expr:gte(t,n_forced*${config.SEGMENT_DURATION_SECONDS})`,
    "-adaptation_sets",
    hasAudio ? "id=0,streams=v id=1,streams=a" : "id=0,streams=v",
    "-f",
    "dash",
    "-seg_duration",
    String(config.SEGMENT_DURATION_SECONDS),
    "-use_template",
    "1",
    "-use_timeline",
    "1",
    // "-streaming",
    // "1",
    // "-window_size",
    // "5",
    // "-extra_window_size",
    // "5",
    "-remove_at_exit",
    "0",
    "-init_seg_name",
    "../cmaf/$RepresentationID$/init.m4s",
    "-media_seg_name",
    "../cmaf/$RepresentationID$/chunk_$Number%05d$.m4s",
    "-hls_playlist",
    "1",
    "-hls_master_name",
    "../hls/master.m3u8.tmp2",
    `${outputDir}/dash/manifest.mpd`,
    // storyboard map
    // "-map",
    // "[storyboard]",
    // "-vsync",
    // "0",
    // "-f",
    // "image2",
    // "-c:v",
    // "mjpeg",
    // "-q:v",
    // "3",
    // `${outputDir}/storyboard_%03d.jpg`,
  ];

  return { args: args, ladder: ladder, hasAudio };
}

function addFrameRateToMasterM3u8(input: string, ladder: LadderEntry[]) {
  const lines = input.split("\n");
  let mediaIndex = 0;

  const patched = lines.map((line) => {
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const fps = ladder[mediaIndex]?.fps;
      mediaIndex += 1;

      if (!fps) return line;
      if (line.includes("FRAME-RATE=")) return line;

      const frameRateValue = fps === 60 ? "60.000" : "30.000";
      return `${line},FRAME-RATE=${frameRateValue}`;
    }

    return line;
  });

  return patched.join("\n");
}

// Effect.tryPromise({
//   try: async () => {
//     const { args, ladder } = buildFfmpegArgs({
//       inputPath: originalPath,
//       outputDir,
//       metadata: videoMetadata,
//       parsedFPS,
//       config,
//     });

//     for (const sub of ["cmaf", "hls", "dash"]) {
//       const dir = `${outputDir}/${sub}`;
//       await Bun.$`mkdir -p ${dir}`;
//       await assertDirectoryExists(dir);
//     }

//     console.log("created folders cmaf, hls, dash");
//     for (const entry of ladder) {
//       const dir = `${outputDir}/cmaf/${entry.representationId}`;
//       await Bun.$`mkdir -p ${dir}`;
//       await assertDirectoryExists(dir);
//     }

//     // audio cmaf
//     await Bun.$`mkdir -p ${outputDir}/cmaf/${ladder.length}`;
//     console.log("created folders for cmaf ladder");

//     console.log("ffmpeg command: ", args.join(" "));
//     const proc = Bun.spawn(args, {
//       stdout: "pipe",
//       stderr: "pipe",
//     });

//     const exitCode = await proc.exited;
//     if (exitCode !== 0) {
//       const stderr = await new Response(proc.stderr).text();
//       throw new Error(`ffmpeg exited with code ${exitCode}: ${stderr}`);
//     }

//     await addFrameRateToMasterM3u8(outputDir, ladder);

//     const paths = await Array.fromAsync(
//       new Bun.Glob("**/{cmaf,hls,dash}/**").scan({
//         cwd: outputDir,
//         absolute: true,
//       }),
//     );
//     return {
//       paths: paths,
//       ladder: ladder,
//     };
//   },
//   catch: (e) =>
//     new VideoProcessingError({
//       cause: e,
//       message: "Error transcoding video",
//     }),
// }),

// async function addFrameRateToMasterM3u8(
//   outputDir: string,
//   ladder: LadderEntry[],
// ) {
//   const masterPath = `${outputDir}/hls/master.m3u8`;
//   const text = await Bun.file(masterPath).text();

//   const lines = text.split("\n");
//   let mediaIndex = 0;

//   const patched = lines.map((line) => {
//     if (line.startsWith("#EXT-X-STREAM-INF:")) {
//       const fps = ladder[mediaIndex]?.fps;
//       mediaIndex += 1;

//       if (!fps) return line;
//       if (line.includes("FRAME-RATE=")) return line;

//       const frameRateValue = fps === 60 ? "60.000" : "30.000";
//       return `${line},FRAME-RATE=${frameRateValue}`;
//     }

//     return line;
//   });

//   await Bun.write(masterPath, patched.join("\n"));
// }

// async function assertDirectoryExists(dir: string) {
//   try {
//     const s = await stat(dir);

//     if (!s.isDirectory()) {
//       throw new Error(`Path exists but is not a directory: ${dir}`);
//     }

//     console.log(`OK directory exists: ${dir}`);
//   } catch (err) {
//     throw new Error(`Missing directory: ${dir}`, { cause: err });
//   }
// }
