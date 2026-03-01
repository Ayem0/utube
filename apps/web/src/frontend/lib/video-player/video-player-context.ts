import { createContext, useContext } from 'react';
import {
  VideoPlayerController,
  VideoPlayerController2,
} from './video-player-controller';
import { VideoPlayerStore } from './video-player-store';
import { VideoPlayerUIDesktop } from './video-player-ui-desktop';

export const VideoPlayerStoreContext = createContext<VideoPlayerStore | null>(
  null,
);

export function useVideoPlayerStore(): VideoPlayerStore {
  const store = useContext(VideoPlayerStoreContext);
  if (!store) {
    throw new Error(
      'useVideoPlayerStore must be used inside VideoPlayerStoreProvider',
    );
  }
  return store;
}

export const VideoPlayerControllerContext =
  createContext<VideoPlayerController | null>(null);

export function useVideoPlayerController(): VideoPlayerController {
  const controller = useContext(VideoPlayerControllerContext);
  if (!controller) {
    throw new Error(
      'useVideoPlayerController must be used inside VideoPlayerControllerProvider',
    );
  }
  return controller;
}

export const VideoPlayerUiDesktopContext = createContext<{
  UI: VideoPlayerUIDesktop;
  controller: VideoPlayerController2;
} | null>(null);

export function useVideoPlayerUiDesktop() {
  const uiDesktop = useContext(VideoPlayerUiDesktopContext);
  if (!uiDesktop) {
    throw new Error(
      'useVideoPlayerUiDesktop must be used inside VideoPlayerUiDesktopProvider',
    );
  }
  return uiDesktop;
}
