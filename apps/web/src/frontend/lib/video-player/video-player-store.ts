// import {
//   getSessionVolumeState,
//   setSessionVolumeState,
// } from '../video-player-volume';
// import { VideoPlayerControllerState } from './video-player';

import { VideoPlayerControllerState } from './video-player-state';

// export type VideoPlayerStoreApi = Pick<
//   VideoPlayerStore,
//   | 'togglePlay'
//   | 'toggleMute'
//   | 'setVolume'
//   | 'toggleFullscreen'
//   | 'setIsDraggingSlider'
//   | 'setIsPreviewing'
//   | 'startSettingVolume'
// >;

// export class VideoPlayerStore {
//   private video: HTMLVideoElement | null = null;
//   private videoContainer: HTMLDivElement | null = null;
//   private sliderContainer: HTMLDivElement | null = null;

//   private rafId: number | null = null;
//   private lastVolume: number = 1;
//   private isDraggingSlider = false;
//   private isPreviewing = false;
//   private sliderWidth = 0;
//   private wasPlaying = false;

//   private state: VideoPlayerControllerState = {
//     volume: 1,
//     muted: false,
//     currentTime: 0,
//     duration: 0,
//     paused: true,
//     ended: false,
//     isFullscreen: false,
//   };
//   private listeners = new Set<() => void>();

//   public subscribe = (listener: () => void) => {
//     this.listeners.add(listener);
//     return () => {
//       this.listeners.delete(listener);
//     };
//   };

//   private notify = () => {
//     this.listeners.forEach((l) => l());
//   };

//   public getSnapshot = () => this.state;

//   public attach = (
//     video: HTMLVideoElement,
//     videoContainer: HTMLDivElement,
//     sliderContainer: HTMLDivElement,
//   ) => {
//     this.video = video;
//     this.videoContainer = videoContainer;
//     this.sliderContainer = sliderContainer;
//     const { volume, muted } = getSessionVolumeState();
//     this.lastVolume = volume;
//     this.state.volume = volume;
//     this.state.muted = muted;
//     this.video.volume = volume;
//     this.video.muted = muted;
//     this.sliderWidth = this.sliderContainer.clientWidth;

//     this.video.addEventListener('loadedmetadata', this.onLoadedMetadata);
//     this.video.addEventListener('play', this.onPlay);
//     this.video.addEventListener('pause', this.onPause);
//     this.video.addEventListener('volumechange', this.onVolumeChange);
//     this.video.addEventListener('timeupdate', this.onTimeUpdate);
//     this.video.addEventListener('ended', this.onEnded);
//     document.addEventListener('fullscreenchange', this.onFullscreenChange);
//     window.addEventListener('resize', this.onResize);
//     this.startRafLoop();
//   };

//   public detach = () => {
//     if (!this.video) return;

//     this.stopRafLoop();
//     this.video.removeEventListener('loadedmetadata', this.onLoadedMetadata);
//     this.video.removeEventListener('play', this.onPlay);
//     this.video.removeEventListener('pause', this.onPause);
//     this.video.removeEventListener('volumechange', this.onVolumeChange);
//     this.video.removeEventListener('timeupdate', this.onTimeUpdate);
//     this.video.removeEventListener('ended', this.onEnded);
//     document.removeEventListener('fullscreenchange', this.onFullscreenChange);
//     window.removeEventListener('resize', this.onResize);
//     this.video = null;
//     this.videoContainer = null;
//     this.sliderContainer = null;
//   };

//   // #region Video controls
//   /** Toggle play/pause */
//   public togglePlay = () => {
//     if (!this.video) return;
//     if (this.video.paused) {
//       this.video.play();
//     } else {
//       this.video.pause();
//     }
//   };
//   /** Toggle mute/unmute */
//   public toggleMute = () => {
//     if (!this.video) return;
//     this.video.muted = !this.video.muted;
//   };
//   /** Set volume */
//   public setVolume = (volume: number) => {
//     if (!this.video) return;
//     if (volume === 0) {
//       this.video.volume = this.lastVolume;
//       this.video.muted = true;
//     } else {
//       this.video.volume = volume;
//       this.video.muted = false;
//     }
//   };
//   /** Store last volume before setting volume */
//   public startSettingVolume = () => {
//     if (!this.video) return;
//     this.lastVolume = this.video.volume;
//   };

//   /** Toggle fullscreen */
//   public toggleFullscreen = () => {
//     if (!this.videoContainer) return;
//     if (document.fullscreenElement) {
//       document.exitFullscreen();
//     } else {
//       this.videoContainer.requestFullscreen();
//     }
//   };
//   // #endregion

//   // #region Internal state setters
//   /** Set if slider is being dragged */
//   public setIsDraggingSlider = (isDraggingSlider: boolean) => {
//     this.isDraggingSlider = isDraggingSlider;
//     if (!this.video) return;
//     if (this.isDraggingSlider) {
//       this.wasPlaying = !this.video.paused;
//       this.video.pause();
//     } else {
//       if (this.wasPlaying) {
//         this.video.play();
//       }
//     }
//   };
//   /** Set if slider is being previewed */
//   public setIsPreviewing = (isPreviewing: boolean) => {
//     this.isPreviewing = isPreviewing;
//   };
//   // #endregion

//   // #region Events handlers
//   /** Handle fullscreen change */
//   private onFullscreenChange = () => {
//     this.state.isFullscreen = document.fullscreenElement !== null;
//     this.notify();
//   };
//   /** Handle loaded metadata */
//   private onLoadedMetadata = () => {
//     if (!this.video) return;
//     this.state.duration = this.video.duration;
//     this.notify();
//   };
//   /** Handle ended */
//   private onEnded = () => {
//     this.state.ended = true;
//     this.notify();
//   };
//   /** Handle pause */
//   private onPause = () => {
//     this.state.paused = true;
//     this.notify();
//   };
//   /** Handle play */
//   private onPlay = () => {
//     this.state.paused = false;
//     this.state.ended = false;
//     this.notify();
//   };
//   /** Handle volume change */
//   private onVolumeChange = () => {
//     if (!this.video) return;
//     this.state.volume = this.video.muted ? 0 : this.video.volume;
//     this.state.muted = this.video.muted;
//     setSessionVolumeState({
//       volume: this.video.muted ? this.lastVolume : this.video.volume,
//       muted: this.video.muted,
//     });
//     this.notify();
//   };
//   /** Handle resize */
//   private onResize = () => {
//     if (!this.sliderContainer || !this.video) return;
//     this.sliderWidth = this.sliderContainer.clientWidth;
//     this.sliderContainer.style.setProperty(
//       '--left',
//       `${(this.video.currentTime / this.video.duration) * this.sliderWidth}px`,
//     );
//   };
//   /** Handle time update */
//   private onTimeUpdate = () => {
//     if (!this.video) return;
//     this.state.currentTime = this.video.currentTime;
//     this.notify();
//   };
//   // #endregion

//   // #region Internal methods
//   /** Notify listeners */

//   /** Start raf loop */
//   private startRafLoop = () => {
//     this.rafId = requestAnimationFrame(this.rafLoop);
//   };
//   /** Raf loop */
//   private rafLoop = () => {
//     if (!this.video || !this.sliderContainer) return;
//     if (!this.video.paused && !this.video.ended) {
//       this.sliderContainer.style.setProperty(
//         '--left',
//         `${(this.video.currentTime / this.video.duration) * this.sliderWidth}px`,
//       );
//     }
//     if (this.isDraggingSlider) {
//     }
//     this.rafId = requestAnimationFrame(this.rafLoop);
//   };
//   /** Stop raf loop */
//   private stopRafLoop = () => {
//     if (this.rafId !== null) {
//       cancelAnimationFrame(this.rafId);
//       this.rafId = null;
//     }
//   };
//   // #endregion
// }

export interface VideoPlayerStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => VideoPlayerControllerState;
}
