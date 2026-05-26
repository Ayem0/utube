import { displayFeature } from "./display";
import { interactionFeature } from "./interaction";
import { playbackFeature } from "./playback";
import { qualityFeature } from "./quality";
import { storyboardFeature } from "./storyboard";
import { timeFeature } from "./time";
import { volumeFeature } from "./volume";

export const videoFeatures = [
  playbackFeature,
  displayFeature,
  volumeFeature,
  timeFeature,
  interactionFeature,
  qualityFeature,
  storyboardFeature,
] as const;
