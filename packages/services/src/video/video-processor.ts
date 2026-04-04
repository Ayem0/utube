import { Context, Effect, Layer } from "effect";
import { VideoMetadata } from "./video";
import { VideoProcessingError } from "./video-errors";

interface VideoProcessorService {
  transcode: (
    originalPath: string,
    rowId: string,
    rawMetadata: VideoMetadata,
    parsedFPS: number,
  ) => Effect.Effect<
    { entries: { key: string; file: Bun.BunFile }[]; ladder: LadderEntry[] },
    VideoProcessingError
  >;
}

export class VideoProcessor extends Context.Tag("VideoProcessor")<
  VideoProcessor,
  VideoProcessorService
>() {}

type LadderEntry = {
  height: number;
  fps: 30 | 60;
  bitrate: string;
  maxrate: string;
  bufsize: string;
  name: string;
};

const SEGMENT_DURATION = 4;

const ABR_LADDER: LadderEntry[] = [
  {
    height: 2160,
    fps: 60,
    bitrate: "12M",
    maxrate: "14M",
    bufsize: "24M",
    name: "2160p60",
  },
  {
    height: 2160,
    fps: 30,
    bitrate: "8M",
    maxrate: "10M",
    bufsize: "16M",
    name: "2160p30",
  },
  {
    height: 1440,
    fps: 60,
    bitrate: "8M",
    maxrate: "10M",
    bufsize: "16M",
    name: "1440p60",
  },
  {
    height: 1440,
    fps: 30,
    bitrate: "6M",
    maxrate: "8M",
    bufsize: "12M",
    name: "1440p30",
  },
  {
    height: 1080,
    fps: 60,
    bitrate: "6M",
    maxrate: "8M",
    bufsize: "12M",
    name: "1080p60",
  },
  {
    height: 1080,
    fps: 30,
    bitrate: "4M",
    maxrate: "6M",
    bufsize: "8M",
    name: "1080p30",
  },
  {
    height: 720,
    fps: 60,
    bitrate: "4M",
    maxrate: "6M",
    bufsize: "8M",
    name: "720p60",
  },
  {
    height: 720,
    fps: 30,
    bitrate: "2.5M",
    maxrate: "4M",
    bufsize: "6M",
    name: "720p30",
  },
  {
    height: 480,
    fps: 30,
    bitrate: "1.2M",
    maxrate: "2M",
    bufsize: "3M",
    name: "480p30",
  },
  {
    height: 360,
    fps: 30,
    bitrate: "800k",
    maxrate: "1M",
    bufsize: "2M",
    name: "360p30",
  },
  {
    height: 240,
    fps: 30,
    bitrate: "400k",
    maxrate: "500k",
    bufsize: "1M",
    name: "240p30",
  },
  {
    height: 144,
    fps: 30,
    bitrate: "200k",
    maxrate: "300k",
    bufsize: "500k",
    name: "144p30",
  },
];

function buildLadder(inputHeight: number, inputFPS: number): LadderEntry[] {
  const maxFPS: 30 | 60 = inputFPS > 50 ? 60 : 30;
  return ABR_LADDER.filter((r) => r.height <= inputHeight && r.fps <= maxFPS);
}

function getVideoStream(metadata: VideoMetadata) {
  return metadata.streams?.find((s) => s.codec_type === "video");
}

function getRotation(metadata: VideoMetadata): number {
  const videoStream = getVideoStream(metadata);
  const rotation =
    videoStream?.tags?.rotate ??
    videoStream?.side_data_list?.find((sd) => sd.rotation != null)?.rotation ??
    0;

  return typeof rotation === "string" ? Number(rotation) : rotation;
}

function getEffectiveDimensions(metadata: VideoMetadata): {
  width: number;
  height: number;
} {
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

function buildNormalizationFilters(metadata: VideoMetadata): string {
  const vfArr: string[] = ["yadif"];

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

function buildFfmpegArgs(params: {
  inputPath: string;
  outputDir: string;
  metadata: VideoMetadata;
  parsedFPS: number;
}) {
  const { inputPath, outputDir, metadata, parsedFPS } = params;

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
    const gop = row.fps * SEGMENT_DURATION;

    return [
      "-map",
      `[v${i}]`,
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
      "high",
      `-pix_fmt:v:${i}`,
      "yuv420p",
    ];
  });

  const hasAudio =
    metadata.streams?.some((s) => s.codec_type === "audio") ?? false;

  const audioArgs = hasAudio
    ? ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "128k", "-ac", "2"]
    : [];

  const args = [
    "ffmpeg",
    "-y",
    "-i",
    inputPath,
    "-map_metadata",
    "-1",
    "-fflags",
    "+genpts",
    "-filter_complex",
    filterComplex,
    ...videoArgs,
    ...audioArgs,
    "-preset",
    "veryfast",
    "-sc_threshold",
    "0",
    "-force_key_frames",
    `expr:gte(t,n_forced*${SEGMENT_DURATION})`,
    "-adaptation_sets",
    hasAudio ? "id=0,streams=v id=1,streams=a" : "id=0,streams=v",
    "-f",
    "dash",
    "-seg_duration",
    String(SEGMENT_DURATION),
    "-use_template",
    "1",
    "-use_timeline",
    "1",
    "-streaming",
    "1",
    "-window_size",
    "5",
    "-extra_window_size",
    "5",
    "-remove_at_exit",
    "0",
    "-init_seg_name",
    "init_$RepresentationID$.m4s",
    "-media_seg_name",
    "chunk_$RepresentationID$_$Number%05d$.m4s",
    "-hls_playlist",
    "1",
    "-hls_master_name",
    "master.m3u8",
    `${outputDir}/manifest.mpd`,
  ];

  return { args: args, ladder: ladder };
}

export const VideoProcessorLive = Layer.effect(
  VideoProcessor,
  Effect.gen(function* () {
    return {
      transcode: (originalPath, rowId, rawMetadata, parsedFPS) =>
        Effect.tryPromise({
          try: async () => {
            const outputDir = `/tmp/${rowId}`;
            await Bun.$`mkdir -p ${outputDir}`;

            const { args, ladder } = buildFfmpegArgs({
              inputPath: originalPath,
              outputDir,
              metadata: rawMetadata,
              parsedFPS,
            });

            for (const entry of ladder) {
              await Bun.$`mkdir -p ${outputDir}/${entry.name}`;
            }

            const proc = Bun.spawn(args, {
              stdout: "pipe",
              stderr: "pipe",
            });

            const exitCode = await proc.exited;
            if (exitCode !== 0) {
              const stderr = await new Response(proc.stderr).text();
              throw new Error(`ffmpeg exited with code ${exitCode}: ${stderr}`);
            }
            const paths = await Array.fromAsync(
              new Bun.Glob("**/*").scan(outputDir),
            );

            // const manifestPath = paths.find((p) => p.endsWith(".mpd"));
            // if (!manifestPath) {
            //   throw new Error("No manifest file found");
            // }

            // const manifestFile = Bun.file(`${outputDir}/${manifestPath}`);
            // const manifestText = await manifestFile.text();

            // const parser = new XMLParser({
            //   ignoreAttributes: false,
            //   attributeNamePrefix: "",
            //   allowBooleanAttributes: true,
            //   parseAttributeValue: true,
            //   trimValues: true,
            // });

            // const manifest: Manifest = parser.parse(manifestText);

            // const representation = buildRepresentation(manifest);

            const entries = paths.map((path) => {
              // const filename = path.split(".")[0] ?? "";
              // const parts = filename.split("_");
              // const index = parts.length === 1 ? -1 : Number(parts[1]);
              // const keySubfolder =
              //   index >= 0 ? representation.get(index)?.name : undefined;
              // const key = keySubfolder
              //   ? .split("/").pop()}`
              //   : `${rowId}/${path.split("/").pop()}`;
              return {
                key: `${rowId}/${path.split("/").pop()}`,
                file: Bun.file(`${outputDir}/${path}`),
              };
            });
            return { entries, ladder };
          },
          catch: (e) =>
            new VideoProcessingError({
              cause: e,
              message: "Error transcoding video",
            }),
        }),
    };
  }),
);

// type ManifestRepresentation = Map<
//   number,
//   {
//     id: number;
//     name: string;
//   }
// >;

// const buildRepresentation = (manifest: Manifest) => {
//   const map: ManifestRepresentation = new Map();
//   const adaptationSet = Array.isArray(manifest.MPD.Period.AdaptationSet)
//     ? manifest.MPD.Period.AdaptationSet
//     : [manifest.MPD.Period.AdaptationSet];
//   adaptationSet.forEach((set) => {
//     const representation = Array.isArray(set.Representation)
//       ? set.Representation
//       : [set.Representation];
//     representation.forEach((r) => {
//       const fr = r.frameRate
//         ? r.frameRate.split("/")[0]
//         : set.frameRate?.split("/")[0];
//       map.set(r.id, {
//         id: r.id,
//         name: set.contentType === "video" ? `${r.height}p${fr}` : "audio",
//       });
//     });
//   });
//   return map;
// };

// type Manifest = {
//   MPD: MPD;
// };

// type MPD = {
//   Period: {
//     AdaptationSet: AdaptationSet[] | AdaptationSet;
//   };
// };

// type AdaptationSet = {
//   Representation: Representation[] | Representation;
//   frameRate?: string;
//   maxFrameRate?: string;
//   width?: number;
//   height?: number;
//   maxWidth?: number;
//   maxHeight?: number;
//   contentType: string;
// };

// type Representation = {
//   id: number;
//   mimeType: string;
//   bandwidth: number;
//   codecs: string;
//   width: number;
//   height: number;
//   sar: string;
//   frameRate?: string;
//   // SegmentTemplate: {
//   //   media: string;
//   //   initialization: string;
//   // };
// };
