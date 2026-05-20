type Cue = {
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

export class StoryboardCore {
  private story: StoryboardVTT = {
    cues: [],
    interval: 0,
    cols: 5,
    rows: 5,
    frameW: 0,
    frameH: 0,
  };

  constructor() {}

  public parseTextTrackCueList(list: TextTrackCueList) {
    const cues: Cue[] = [];
    for (let i = 0; i < list.length; i++) {
      const cue = list[i] as VTTCue;
      const parts = cue.text.split("#");
      const [img, rect] = parts;
      if (!img || !rect) continue;
      const rectParts = rect.split("=");
      if (rectParts.length < 2) continue;
      const [x, y, w, h] = rectParts[1]!.split(",").map((v) => Number(v));
      if (!x || !y || !w || !h) continue;
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
    this.story = {
      cues,
      interval: cues[0] ? cues[0].end - cues[0].start : 0,
      cols: 5,
      rows: 5,
      frameW: cues[0] ? cues[0].w : 0,
      frameH: cues[0] ? cues[0].h : 0,
    };
  }

  public findFrame(time: number): Cue | undefined {
    const index = Math.floor(time / this.story.interval);
    if (index <= 0 || index >= this.story.cues.length - 1) return undefined;
    return this.story.cues[index];
  }
}
