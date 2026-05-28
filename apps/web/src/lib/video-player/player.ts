import { videoFeatures } from '@repo/video-player/feature/core/video-features';
import type { PlayerFeatureOptions } from '@repo/video-player/feature/feature';
import { createPlayer } from './create-player';
import {
  getSessionVolumeState,
  setSessionVolumeState,
} from './video-player-volume';

const defaultPlaybackRate = 1; // TODO fetch from localstorage / session storage
const defaultQuality = -1; // TODO fetch from localstorage / session storage (-1 means auto)

const { muted: defaultMuted, volume: defaultVolume } = getSessionVolumeState();

export const player = createPlayer({
  features: videoFeatures,
  engineOptions: { quality: defaultQuality },
  featureOptions: {
    playback: {
      stateArgs: [defaultPlaybackRate],
    },
    volume: {
      stateArgs: [defaultVolume, defaultMuted],
      internalStateArgs: [
        defaultVolume,
        (volume, muted) => setSessionVolumeState({ volume, muted }),
      ],
    },
  } satisfies PlayerFeatureOptions<typeof videoFeatures>,
});
