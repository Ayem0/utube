import type {
  VideoMetadataAudioStream,
  VideoMetadataVideoStream,
} from "@repo/types/effect/schemas/index";
import { join } from "node:path";

type BuildOptions = {
  outputDir: string;
  segmentDurationSeconds: number;
};

type ABREntry = {
  short: number;
  fps: number;
  crf: number;
  maxrate: number; // bits per second
  bufsize: number; // bits
};
function getRotation(stream: VideoMetadataVideoStream) {
  const rotation =
    stream.side_data_list?.find((t) => t.rotation !== undefined)?.rotation ??
    stream.tags?.rotate ??
    0;
  const normalized = ((rotation % 360) + 360) % 360;
  return normalized;
}

// --------------------------------------------------
// 1. Source geometry and HDR detection
// --------------------------------------------------

function getEffectiveDimensions(stream: VideoMetadataVideoStream) {
  const rotation = getRotation(stream);
  const rotated = rotation === 90 || rotation === 270;

  return rotated
    ? { width: stream.height, height: stream.width }
    : { width: stream.width, height: stream.height };
}

function isHDR(stream: VideoMetadataVideoStream): boolean {
  return (
    stream.color_transfer === "smpte2084" ||
    stream.color_transfer === "arib-std-b67"
  );
}

// --------------------------------------------------
// 2. Source normalization
// --------------------------------------------------

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

// --------------------------------------------------
// 3. Rendition scaling
// --------------------------------------------------

function buildScaleFilter(entry: ABREntry, portrait: boolean): string {
  const maxLongSide = 3840;

  // Calculate physical width using FFmpeg's display
  // aspect ratio (DAR), including non-square pixels.
  const widthExpression = portrait
    ? `2*trunc(min(${entry.short},${maxLongSide}*dar)/2)`
    : `2*trunc(min(${maxLongSide},${entry.short}*dar)/2)`;

  const heightExpression = "2*trunc(ow/dar/2)";

  return [
    `scale=w='${widthExpression}'`,
    `h='${heightExpression}'`,
    "flags=lanczos",
  ].join(":");
}

// --------------------------------------------------
// 4. Complex filter graph
// --------------------------------------------------

function buildFilterComplex(
  stream: VideoMetadataVideoStream,
  entries: ABREntry[],
): string {
  if (entries.length === 0) {
    throw new Error("At least one rendition is required");
  }

  const { width, height } = getEffectiveDimensions(stream);
  const portrait = height > width;

  const splitLabels = entries.map((_, i) => `[s${i}]`).join("");

  // Common processing runs before splitting.
  const sharedFilters = [
    ...buildNormalizationFilters(stream),
    `split=${entries.length}${splitLabels}`,
  ];

  const sourceChain = `[0:${stream.index}]${sharedFilters.join(",")}`;

  // Every rendition has its own scale and FPS filter.
  const renditionChains = entries.map((entry, i) => {
    const filters = [
      buildScaleFilter(entry, portrait),
      "setsar=1",
      `fps=${entry.fps}`,
    ];

    return `[s${i}]${filters.join(",")}[v${i}]`;
  });

  return [sourceChain, ...renditionChains].join(";");
}

// --------------------------------------------------
// 5. Video encoder options
// --------------------------------------------------

function buildVideoEncoderArgs(
  entry: ABREntry,
  index: number,
  segmentDuration: number,
  hdr: boolean,
): string[] {
  const gop = Math.ceil(entry.fps * segmentDuration);
  const profile = entry.short >= 720 ? "high" : "main";

  const args: string[] = [
    `-c:v:${index}`,
    "libx264",
    `-preset:v:${index}`,
    "veryfast",

    // Capped CRF rate control
    `-crf:v:${index}`,
    String(entry.crf),
    `-maxrate:v:${index}`,
    String(Math.round(entry.maxrate)),
    `-bufsize:v:${index}`,
    String(Math.round(entry.bufsize)),

    // GOP and segment alignment
    `-g:v:${index}`,
    String(gop),
    `-keyint_min:v:${index}`,
    String(gop),
    `-sc_threshold:v:${index}`,
    "0",
    `-force_key_frames:v:${index}`,
    `expr:gte(t,n_forced*${segmentDuration})`,

    // H.264 compatibility
    `-profile:v:${index}`,
    profile,
    `-pix_fmt:v:${index}`,
    "yuv420p",
    `-flags:v:${index}`,
    "+cgop",
  ];

  if (hdr) {
    args.push(
      `-color_primaries:v:${index}`,
      "bt709",
      `-color_trc:v:${index}`,
      "bt709",
      `-colorspace:v:${index}`,
      "bt709",
    );
  }

  return args;
}

// --------------------------------------------------
// 6. Audio encoder options
// --------------------------------------------------

function buildAudioEncoderArgs(
  audioStream: VideoMetadataAudioStream | undefined,
): string[] {
  if (!audioStream) return [];

  return [
    "-c:a:0",
    "aac",
    "-b:a:0",
    "128k",
    "-ar:a:0",
    "48000",
    "-ac:a:0",
    String(Math.min(audioStream.channels, 2)),
  ];
}

// --------------------------------------------------
// 7. DASH + HLS packaging
// --------------------------------------------------

function buildPackagingArgs(
  options: BuildOptions,
  hasAudio: boolean,
): string[] {
  const adaptationSets = hasAudio
    ? "id=0,streams=v id=1,streams=a"
    : "id=0,streams=v";

  return [
    "-f",
    "dash",
    "-dash_segment_type",
    "mp4",

    "-seg_duration",
    String(options.segmentDurationSeconds),
    "-use_template",
    "1",
    "-use_timeline",
    "1",
    "-remove_at_exit",
    "0",

    "-adaptation_sets",
    adaptationSets,

    "-init_seg_name",
    "../cmaf/$RepresentationID$/init.m4s",

    "-media_seg_name",
    "../cmaf/$RepresentationID$/chunk_$Number%05d$.m4s",

    "-hls_playlist",
    "1",
    "-hls_master_name",
    "master.m3u8",

    join(options.outputDir, "dash", "manifest.mpd"),
  ];
}

// --------------------------------------------------
// 8. Final argument builder
// --------------------------------------------------

function createArgsBuilder(options: BuildOptions) {
  return function buildArgs(
    input: string,
    videoStream: VideoMetadataVideoStream,
    audioStream: VideoMetadataAudioStream | undefined,
    entries: ABREntry[],
  ) {
    if (entries.length === 0) {
      throw new Error("No ABR renditions were generated");
    }

    if (
      !Number.isFinite(options.segmentDurationSeconds) ||
      options.segmentDurationSeconds <= 0
    ) {
      throw new Error("Invalid segment duration");
    }

    const hasAudio = audioStream !== undefined;
    const hdr = isHDR(videoStream);

    const filterComplex = buildFilterComplex(videoStream, entries);

    // Output streams: video 0..N-1, then optional audio.
    const videoMaps = entries.flatMap((_, i) => ["-map", `[v${i}]`]);

    const audioMap = audioStream ? ["-map", `0:${audioStream.index}`] : [];

    const videoEncoderArgs = entries.flatMap((entry, i) =>
      buildVideoEncoderArgs(entry, i, options.segmentDurationSeconds, hdr),
    );

    const args: string[] = [
      "-y",

      // Input
      "-i",
      input,

      // Metadata
      "-map_metadata",
      "-1",

      // Filtering
      "-filter_complex_threads",
      "2",
      "-filter_complex",
      filterComplex,

      // Output stream mapping
      ...videoMaps,
      ...audioMap,

      // Encoding
      ...videoEncoderArgs,
      ...buildAudioEncoderArgs(audioStream),

      // Packaging
      ...buildPackagingArgs(options, hasAudio),
    ];

    return {
      args,
      filterComplex,
      entries,
      hasAudio,
    };
  };
}
