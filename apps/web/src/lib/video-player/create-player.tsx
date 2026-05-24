import type { EngineOptions } from '@repo/video-player/engine/engine';
import type {
  FeatureRegistry,
  Features,
  PlayerFeatureOptions,
} from '@repo/video-player/feature/feature';
import { createPlayer as createPlayerCore } from '@repo/video-player/player/player';
import type { DeepSignal } from '@repo/video-player/store/store';
// import { StoreState } from '@repo/video-player/store/store';
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
  engineOptions,
  featureOptions,
}: {
  features: T;
  engineOptions?: EngineOptions | undefined;
  featureOptions?: PlayerFeatureOptions<T> | undefined;
}) => {
  const player = createPlayerCore({ features, engineOptions, featureOptions });
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
    return player.apis[featureName];
  };

  const usePlayerState = <S,>(
    selector: (state: DeepSignal<FeatureRegistry<T>['state']>) => DeepSignal<S>,
  ) => {
    const { getSnapshot, subscribe } = player.store.use(selector);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };

  return {
    Provider,
    usePlayerApi,
    usePlayerState,
    usePlayerContext,
  };
};
