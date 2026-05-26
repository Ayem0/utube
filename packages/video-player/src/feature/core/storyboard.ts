import { createFeature } from "../feature";

export type Cue = {
  start: number;
  end: number;
  img: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type StoryboardVTT = {
  cues: Cue[];
  interval: number;
  cols: 5;
  rows: 5;
  frameW: number;
  frameH: number;
};

export const storyboardFeature = createFeature({
  name: "storyboard",
  getState: () => ({
    activeCue: null as Cue | null,
  }),
  getInternalState: () => ({
    track: null as HTMLTrackElement | null,
    storyboardVTT: null as StoryboardVTT | null,
  }),
  getApi: (ctx) => {
    const onLoad = () => {
      console.log("on load");
      const cues = ctx.internalState.track?.track.cues;
      if (!cues) return;
      ctx.internalState.storyboardVTT = parseTextTrackCueList(cues);
    };
    const attachTrack = (track: HTMLTrackElement) => {
      track.track.mode = "hidden";
      ctx.internalState.track = track;
      if (track.readyState === track.LOADED && track.track.cues) {
        console.log("already loaded");
        ctx.internalState.storyboardVTT = parseTextTrackCueList(
          track.track.cues,
        );
      }
      track.addEventListener("load", onLoad);
    };
    const detachTrack = () => {
      ctx.internalState.track?.track.removeEventListener("cuechange", onLoad);
      ctx.internalState.track = null;
      ctx.internalState.storyboardVTT = null;
    };

    const setActiveCue = (time: number) => {
      const story = ctx.internalState.storyboardVTT;
      if (!story) return;
      const cue = findFrame(time, story);
      ctx.state.activeCue(cue);
    };

    return {
      attachTrack,
      detachTrack,
      setActiveCue,
    };
  },
});

function parseTextTrackCueList(list: TextTrackCueList): StoryboardVTT {
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
      img: img,
      x,
      y,
      w,
      h,
    });
  }
  return {
    cues,
    interval: cues[0] ? cues[0].end - cues[0].start : 0,
    cols: 5,
    rows: 5,
    frameW: cues[0] ? cues[0].w : 0,
    frameH: cues[0] ? cues[0].h : 0,
  };
}

function findFrame(time: number, story: StoryboardVTT): Cue | null {
  const index = Math.floor(time / story.interval);
  if (index < 0 || index > story.cues.length - 1) return null;
  return story.cues[index] ?? null;
}
