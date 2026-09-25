import type {
  AnyFeature,
  FeatureApi,
  Features,
  FeatureState,
} from '@repo/video-player/feature/feature';
import type {
  ControllerContext,
  Player,
} from '@repo/video-player/player/player';
import type { DeepSignal } from '@repo/video-player/store/store';
import type { VideoSource } from '@repo/video-player/types';
import type { ReactNode, RefObject } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

type PlayerContextValue = {
  player: Player<any>;
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

type PlayerProviderProps<T extends Features> = {
  player: Player<T>;
  children: ReactNode;
};

export function PlayerProvider<const T extends Features>({
  player,

  children,
}: PlayerProviderProps<T>) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    player.attach(video, containerRef.current ?? undefined);

    return () => {
      player.detach();
    };
  }, [player]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      player,

      videoRef,
      containerRef,
    }),
    [player],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

function usePlayerContext(): PlayerContextValue {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error(
      'Player hooks must be used inside the matching PlayerProvider',
    );
  }

  return context;
}

export function usePlayerApi<F extends AnyFeature>(feature: F): FeatureApi<F> {
  const { player } = usePlayerContext();
  return player.apis[feature.name];
}

export function usePlayerState<F extends AnyFeature, S>(
  feature: F,
  selector: (state: DeepSignal<FeatureState<F>>) => DeepSignal<S>,
): S {
  const { player } = usePlayerContext();
  const featureState = player.store.select((state) => state[feature.name]);
  const signal = selector(featureState as DeepSignal<FeatureState<F>>);
  const subscribe = useCallback(
    (listener: () => void) => player.store.subscribe(signal, listener),
    [],
  );
  const getSnapshot = useCallback(() => signal(), []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function usePlayerControllerContext<F extends Features>(
  features: F,
): ControllerContext<F> {
  const { player } = usePlayerContext();
  for (const feature of features) {
    if (!player.apis[feature.name]) {
      throw new Error(`Feature ${feature.name} not found`);
    }
  }
  return player.getControllerContext();
}

export function usePlayerRefs() {
  const { videoRef, containerRef } = usePlayerContext();
  return { videoRef, containerRef };
}

// export function usePlayerSource() {
//   const { player } = usePlayerContext();
//   return player.loadSource;
// }

export function usePlayerSource() {
  const { player } = usePlayerContext();

  return useCallback(
    (
      source: VideoSource,
      options?: {
        startPosition?: number;
      },
    ) => {
      player.loadSource(source, options);
    },
    [player],
  );
}
// /**
//  * Creates React bindings for a feature schema.
//  *
//  * The bindings are tied to T's feature types, but not to a specific
//  * Player<T> instance.
//  */
// function createPlayerBindings<const T extends Features>() {
//   function usePlayerApi<K extends T[number]['name']>(
//     featureName: K,
//   ): FeatureRegistry<T>['api'][K] {
//     const { player } = usePlayerContext();
//     return player.apis[featureName];
//   }

//   function usePlayerState<S>(
//     selector: (state: DeepSignal<FeatureRegistry<T>['state']>) => DeepSignal<S>,
//   ): S {
//     const { player } = usePlayerContext();
//     const { getSnapshot, subscribe } = player.store.use(selector);

//     return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
//   }

//   const getControllerContext = () => {
//     const { player } = usePlayerContext();
//     return player.getControllerContext();
//   };

//   return {
//     PlayerProvider,
//     usePlayerApi,
//     usePlayerState,
//     usePlayerContext,
//     getControllerContext,
//   };
// }

// export const {
//   PlayerProvider,
//   usePlayerApi,
//   usePlayerState,
//   usePlayerContext,
//   getControllerContext,
// } = createPlayerBindings<typeof videoFeatures>();
