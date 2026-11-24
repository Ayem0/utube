import {
  type VideoMetadataAudioStream,
  type VideoMetadataValidated,
  type VideoMetadataVideoStream,
} from "@repo/types/effect/schemas";
import { Context, Effect, Layer, Stream } from "effect";
import { VideoProcessingError } from "./video-errors";
import { VideoProcessorConfig } from "./video-processor-config";

import { FileSystem } from "effect/FileSystem";
import { ChildProcess } from "effect/process";
import type { ChildProcessSpawner } from "effect/process/ChildProcessSpawner";
import type { Scope } from "effect/Scope";

interface VideoProcessorService {
  transcode: (params: {
    input: string;
    outputDir: string;
    metadata: VideoMetadataValidated;
  }) => Effect.Effect<
    ABREntry[],
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
      transcode: Effect.fn(
        function* ({ input, outputDir, metadata }) {
          // TODO make buildFfmpegArgs an effect
          const entries = generateABREntries(metadata.videoStream);
          const args = buildArgs({
            audioStream: metadata.audioStream,
            entries,
            input,
            outputDir,
            videoStream: metadata.videoStream,
          });

          yield* Effect.log("Ladder:", entries);

          yield* makeDirectories([
            `${outputDir}/cmaf`,
            `${outputDir}/hls`,
            `${outputDir}/dash`,
            ...entries.map((_, i) => `${outputDir}/cmaf/${i}`),
            ...(metadata.audioStream
              ? [`${outputDir}/cmaf/${entries.length}`]
              : []),
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
          const patched = addFrameRateToMasterM3u8(master, entries);
          yield* fs.writeFileString(`${outputDir}/hls/master.m3u8`, patched);

          return entries;
        },
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

type ABREntry = {
  short: number;
  fps: number;
  crf: number;
  maxrate: number;
  bufsize: number;
};
const renditionsShortSide = [
  144, 240, 360, 480, 720, 1080, 1440, 2160,
] as const;

function generateABREntries(stream: VideoMetadataVideoStream) {
  const entries: ABREntry[] = [];
  const sourceShort = Math.min(stream.width, stream.height);
  const sourceLong = Math.max(stream.width, stream.height);
  const ratio = sourceLong / sourceShort;

  renditionsShortSide.forEach((short) => {
    if (sourceShort >= short) {
      const fps = short < 720 && stream.fps > 30 ? stream.fps / 2 : stream.fps;
      const long = Math.round(short * ratio);
      const estimatedBitrate = short * long * fps * 0.08;
      const maxrate = Math.round(estimatedBitrate * 1.5);
      const bufsize = Math.round(maxrate * 2);
      entries.push({
        bufsize: bufsize,
        crf: 21,
        fps: fps,
        short: short,
        maxrate: maxrate,
      });
    }
  });

  return entries;
}

// TODO can be improved to check every type of hdr content
function isHDR(stream: VideoMetadataVideoStream): boolean {
  return (
    stream.color_transfer === "smpte2084" ||
    stream.color_transfer === "arib-std-b67"
  );
}

// TODO can be improved, normalize color if input is sdr but not bt709
function buildNormalizationFilters(stream: VideoMetadataVideoStream): string[] {
  if (!isHDR(stream)) return [];

  // HDR -> linear-light RGB -> tone mapping -> SDR Rec.709
  return [
    "zscale=transfer=linear:npl=100",
    "format=gbrpf32le",
    "tonemap=tonemap=hable",
    "zscale=primaries=bt709:transfer=bt709:matrix=bt709",
    "format=yuv420p",
  ];
}

function buildArgs({
  audioStream,
  entries,
  input,
  outputDir,
  videoStream,
}: {
  input: string;
  videoStream: VideoMetadataVideoStream;
  audioStream: VideoMetadataAudioStream | undefined;
  entries: ABREntry[];
  outputDir: string;
}) {
  const filterComplex = buildFilterComplex(videoStream, entries);
  const isHDRVideo = isHDR(videoStream);
  const videoArgs = entries.flatMap((entry, i) =>
    buildVideoEncoderArgs(entry, i, isHDRVideo),
  );
  const audioArgs = buildAudioArgs(audioStream);
  const adaptation_sets = audioStream
    ? "id=0,streams=v id=1,streams=a"
    : "id=0,streams=v";
  return [
    "-y",
    "-i",
    input,
    "-map_metadata",
    "-1",
    "-filter_complex",
    filterComplex,
    "-filter_complex_threads",
    "2",
    ...videoArgs,
    ...audioArgs,
    "-adaptation_sets",
    adaptation_sets,
    "-f",
    "dash",
    "-seg_duration",
    String(4),
    "-use_template",
    "1",
    "-use_timeline",
    "1",
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
  ];
}

function buildFilterComplex(
  videoStream: VideoMetadataVideoStream,
  entries: ABREntry[],
) {
  const labels = entries.map((_, i) => `[s${i}]`).join("");
  const normalizationFilters = buildNormalizationFilters(videoStream);
  const sourceFilters = [
    ...normalizationFilters,
    `split=${entries.length}${labels}`,
  ];
  const source = `[0:${videoStream.index}]${sourceFilters.join(",")}`;
  const renditions = entries.map((entry, i) => {
    const scale = `scale=w='if(gte(dar,1),-2,${entry.short})':h='if(gte(dar,1),${entry.short},-2)':flags=lanczos:reset_sar=1`;
    const filters = [scale, `fps=${entry.fps}`];

    return `[s${i}]${filters.join(",")}[v${i}]`;
  });

  return [source, ...renditions].join(";");
}

function buildVideoEncoderArgs(entry: ABREntry, i: number, hdr: boolean) {
  const gop = Math.ceil(entry.fps);
  const args: string[] = [
    "-map",
    `[v${i}]`,
    `-threads:v:${i}`,
    "2",
    `-c:v:${i}`,
    "libx264",
    `-crf:v:${i}`,
    String(entry.crf),
    `-maxrate:v:${i}`,
    `${entry.maxrate}`,
    `-bufsize:v:${i}`,
    `${entry.bufsize}`,
    `-g:v:${i}`,
    `${gop}`,
    `-sc_threshold:v:${i}`,
    "0",
    `-flags:v:${i}`,
    "+cgop",
    `-keyint_min:v:${i}`,
    `${gop}`,
    // Request keyframes at segment boundaries
    // TODO see if useful
    // `-force_key_frames:v:${i}`,
    // `expr:gte(t,n_forced*4)`,
    `-pix_fmt:v:${i}`,
    "yuv420p",
    `-preset:v:${i}`,
    "veryfast",
    // TODO test later
    // `-tune:v:${i}`,
    // "fastdecode",
    // `-x264-params:v:${i}`,
    // "ref=2:bframes=2:b-pyramid=none:weightp=1:rc-lookahead=10:force-cfr=1",
  ];

  if (hdr) {
    args.push(
      `-color_primaries:v:${i}`,
      "bt709",
      `-color_trc:v:${i}`,
      "bt709",
      `-colorspace:v:${i}`,
      "bt709",
    );
  }

  return args;
}

function buildAudioArgs(audioStream: VideoMetadataAudioStream | undefined) {
  if (!audioStream) return [];

  const channels = Math.min(audioStream.channels, 2);
  const bitrate = channels === 2 ? "128k" : "80k";

  return [
    // Select the input audio stream
    "-map",
    `0:${audioStream.index}`,

    // AAC encoding
    "-c:a:0",
    "aac",
    "-b:a:0",
    bitrate,

    // Output channel count
    "-ac:a:0",
    String(channels),

    // Normalize sample rate
    "-ar:a:0",
    "48000",
  ];
}

function addFrameRateToMasterM3u8(input: string, ladder: ABREntry[]) {
  const lines = input.split("\n");
  let mediaIndex = 0;

  const patched = lines.map((line) => {
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const fps = ladder[mediaIndex]?.fps;
      mediaIndex += 1;

      if (!fps) return line;
      if (line.includes("FRAME-RATE=")) return line;

      return `${line},FRAME-RATE=${fps.toFixed(3)}`;
    }

    return line;
  });

  return patched.join("\n");
}
