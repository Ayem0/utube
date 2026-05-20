import { videoFeatures } from '@repo/video-player/feature/core/video-features';
import { createPlayer } from './create-player';

const { Provider, usePlayerApi, usePlayerState, usePlayerContext } =
  createPlayer({
    features: videoFeatures,
  });

export {
  Provider as PlayerProvider,
  usePlayerApi,
  usePlayerContext,
  usePlayerState,
};
