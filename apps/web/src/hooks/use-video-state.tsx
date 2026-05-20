import { useSyncExternalStore } from 'react';
import { useVideoPlayerStore } from '../lib/video-player1/video-player-context';
import { VideoPlayerControllerState } from '../lib/video-player1/video-player-state';

export function useVideoPlayerStates<T>(
  selector: (state: VideoPlayerControllerState) => T,
) {
  const store = useVideoPlayerStore();

  // Keep track of the last selected slice
  let lastSelected: T | null = null;

  return useSyncExternalStore(store.subscribe, () => {
    const snapshot = store.getSnapshot();
    const selected = selector(snapshot);

    if (typeof selected !== 'object' || selected === null) {
      lastSelected = selected;
    } else {
      if (
        !lastSelected ||
        Object.keys(selected).some(
          (key) =>
            selected[key as keyof typeof selected] !==
            lastSelected![key as keyof typeof selected],
        )
      ) {
        lastSelected = selected;
      }
    }

    return lastSelected;
  });
}

export function useVideoPlayerState<K extends keyof VideoPlayerControllerState>(
  key: K,
) {
  const store = useVideoPlayerStore();
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot()[key]);
}
