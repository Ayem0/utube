import { videoFeatures } from '@repo/video-player/feature/core/video-features';
import { createPlayer } from '@repo/video-player/player/player';
import {
  getSessionVolumeState,
  setSessionVolumeState,
} from './video-player-volume';
import type { PlayerFeatureOptions } from '@repo/video-player/feature/feature';

const defaultPlaybackRate = 1; // TODO fetch from localstorage / session storage
const defaultQuality = -1; // TODO fetch from localstorage / session storage (-1 means auto)

const { muted: defaultMuted, volume: defaultVolume } = getSessionVolumeState();

export const watchPlayer = createPlayer({
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
