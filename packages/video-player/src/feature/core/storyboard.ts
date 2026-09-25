import { createFeature } from "../feature";
import { authzFeature } from "./authz";

export type Cue = {
  start: number;
  end: number;
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type StoryboardVTT = {
  cues: Cue[];
  invInterval: number;
  cols: 5;
  rows: 5;
  frameW: number;
  frameH: number;
};

export const storyboardFeature = createFeature({
  name: "storyboard",
  dependencies: [authzFeature],
  getState: () => ({}),
  getInternalState: () => ({
    track: null as HTMLTrackElement | null,
    storyboardVTT: null as StoryboardVTT | null,
  }),
  getApi: (ctx) => {
    const onLoad = () => {
      const track = ctx.internalState.track;
      if (!track || !track.track.cues) return;
      ctx.internalState.storyboardVTT = parseTextTrackCueList(
        track.track.cues,
        track.src,
      );
    };
    const attachTrack = (track: HTMLTrackElement, src: string) => {
      track.track.mode = "hidden";
      ctx.internalState.track = track;
      track.src = ctx.dependencies.authz.api.authorizedUrl(src);

      if (track.readyState === track.LOADED && track.track.cues) {
        console.log("already loaded");
        ctx.internalState.storyboardVTT = parseTextTrackCueList(
          track.track.cues,
          track.src,
        );
      }
      track.addEventListener("load", onLoad);
    };
    const detachTrack = () => {
      ctx.internalState.track?.removeEventListener("load", onLoad);
      ctx.internalState.track = null;
      ctx.internalState.storyboardVTT = null;
    };

    const getCue = (time: number) => {
      const story = ctx.internalState.storyboardVTT;
      if (!story) return;
      const cue = findFrame(time, story);
      if (cue) {
        return {
          ...cue,
          src: ctx.dependencies.authz.api.authorizedUrl(cue.src),
        };
      }
      return cue;
    };

    return {
      attachTrack,
      detachTrack,
      getCue,
    };
  },
});

function parseTextTrackCueList(
  list: TextTrackCueList,
  vttUrl: string,
): StoryboardVTT {
  console.log("in parseTextTrackCueList");
  const cues: Cue[] = [];
  for (let i = 0; i < list.length; i++) {
    const cue = list[i] as VTTCue;
    const parts = cue.text.split("#");
    const [img, rect] = parts;
    if (!img || !rect) continue;
    const rectParts = rect.split("=");
    if (rectParts.length < 2) continue;
    const [x, y, w, h] = rectParts[1]!.split(",").map((v) => Number(v));
    if (x == undefined || y == undefined || w == undefined || h == undefined)
      continue;
    if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) continue;

    cues.push({
      end: cue.endTime,
      start: cue.startTime,
      src: new URL(img, vttUrl).href,
      x,
      y,
      w,
      h,
    });
  }
  return {
    cues,
    invInterval: cues[0] ? 1 / (cues[0].end - cues[0].start) : 0,
    cols: 5,
    rows: 5,
    frameW: cues[0] ? cues[0].w : 0,
    frameH: cues[0] ? cues[0].h : 0,
  };
}

function findFrame(time: number, story: StoryboardVTT): Cue | null {
  const index = Math.floor(time * story.invInterval);
  if (index < 0 || index > story.cues.length - 1) return null;
  return story.cues[index] ?? null;
}
