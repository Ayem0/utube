export interface VideoQuality {
  index: number;
  height: number;
  frameRate: number;
}

export interface VideoSource {
  hls?: string;
  dash?: string;
}

export type Disposer = () => void;
