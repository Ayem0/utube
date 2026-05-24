import { videoFeatures } from '@repo/video-player/feature/core/video-features';
import { createPlayer } from './create-player';

const defaultPlaybackRate = 1; // TODO fetch from localstorage / session storage
const defaultVolume = 1; // TODO fetch from localstorage / session storage
const defaultMuted = false; // TODO fetch from localstorage / session storage
const defaultQuality = -1; // TODO fetch from localstorage / session storage (-1 means auto)

const { Provider, usePlayerApi, usePlayerState, usePlayerContext } =
  createPlayer({
    features: videoFeatures,
    engineOptions: { quality: defaultQuality },
    featureOptions: {
      playback: {
        stateArgs: [defaultPlaybackRate],
      },
      volume: {
        stateArgs: [defaultVolume, defaultMuted],
      },
    },
  });

export {
  Provider as PlayerProvider,
  usePlayerApi,
  usePlayerContext,
  usePlayerState,
};
