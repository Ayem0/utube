export interface StoryboardJson {
  interval: number;
  frameW: number;
  frameH: number;
  frameCount: number;
  sprites: Sprite[];
  duration: number;
}

export interface Sprite {
  cols: number;
  rows: number;
  url: string;
  start: number;
  end: number;
}
