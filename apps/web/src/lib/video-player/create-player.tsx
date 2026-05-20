import type { Features } from '@repo/video-player/feature/feature';
import { createPlayer as createPlayerCore } from '@repo/video-player/player/factory';
import { StoreState } from '@repo/video-player/store/store';
import { VideoSource } from '@repo/video-player/types';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';

export const createPlayer = <T extends Features>({
  features,
  defaultQuality,
}: {
  features: T;
  defaultQuality?: number;
}) => {
  const player = createPlayerCore({ features, defaultQuality });
  const Context = createContext<{
    source: VideoSource;
    storyboardUrl?: string;
    videoRef: React.RefObject<HTMLVideoElement | null> | null;
    containerRef: React.RefObject<HTMLDivElement | null> | null;
  }>({
    source: {
      dash: undefined,
      hls: undefined,
    },
    storyboardUrl: undefined,
    videoRef: null,
    containerRef: null,
  });
  const Provider = ({
    source,
    storyboardUrl,
    children,
  }: {
    source: VideoSource;
    storyboardUrl?: string;
    children: React.ReactNode;
  }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      player.loadSource(source);
    }, [source]);

    useEffect(() => {
      const v = videoRef.current;
      const c = containerRef.current;
      if (!v) return;
      player.attach(v, c ?? undefined);
      return () => {
        player.detach();
      };
    }, [videoRef.current, containerRef.current]);

    return (
      <Context.Provider
        value={{
          source: source,
          storyboardUrl: storyboardUrl,
          videoRef,
          containerRef,
        }}
      >
        {children}
      </Context.Provider>
    );
  };

  const usePlayerContext = () => {
    return useContext(Context);
  };

  const usePlayerApi = <K extends T[number]['name']>(featureName: K) => {
    return player.store.getApi(featureName);
  };

  const usePlayerState: {
    <K extends T[number]['name']>(featureName: K): StoreState<T>[K];

    <K extends T[number]['name'], SS>(
      featureName: K,
      selector: (state: StoreState<T>[K]) => SS,
    ): SS;
  } = <K extends T[number]['name'], SS>(
    featureName: K,
    selector?: (state: StoreState<T>[K]) => SS,
  ) => {
    const getSnapshot = () =>
      selector
        ? player.store.getFeatureSnapshot(featureName, selector)
        : player.store.getFeatureSnapshot(featureName);
    return useSyncExternalStore(
      (onStoreChange) =>
        player.store.subscribeFeature(featureName, onStoreChange),
      getSnapshot,
      getSnapshot,
    );
  };

  return {
    Provider,
    usePlayerApi,
    usePlayerState,
    usePlayerContext,
  };
};
