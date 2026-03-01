// import { VideoPlayerController2 } from './video-player-controller';

// /**
//  * VideoPlayerInteraction
//  *
//  * Handles interaction with the document for the video player
//  */
// export class VideoPlayerInteraction {
//   private videoPlayerController: VideoPlayerController2;

//   private isFocused = false;
//   private focusTarget: HTMLElement | null = null;

//   private volumeSliderId!: string;
//   private ids: string[] = [];

//   constructor(videoPlayerController: VideoPlayerController2) {
//     this.videoPlayerController = videoPlayerController;
//     this.setIds(this.videoPlayerController.id);
//     this.initListeners();
//   }

//   private setIds = (id: string) => {
//     this.volumeSliderId = `video-player-slider-${id}`;
//     this.ids = [this.volumeSliderId];
//   };

//   private initListeners() {
//     document.addEventListener('keydown', this.onKeyDown);
//   }

//   public destroy() {
//     this.destroyListeners();
//   }

//   private destroyListeners() {
//     document.removeEventListener('keydown', this.onKeyDown);
//   }

//   private onKeyDown = (e: KeyboardEvent) => {
//     if (this.isFocused && this.focusTarget !== null) return;
//     this.globalPlayerShorcuts(e);
//   };

//   private globalPlayerShorcuts = (e: KeyboardEvent) => {
//     if (e.metaKey) {
//       // see what meta key is pressed and handle accordingly
//     } else {
//       switch (e.key) {
//         case ' ':
//           this.videoPlayerController.togglePlay();
//           break;
//         case 'ArrowRight':
//           this.videoPlayerController.seek(5);
//           break;
//         case 'ArrowLeft':
//           this.videoPlayerController.seek(-5);
//           break;
//         case 'ArrowUp':
//           this.videoPlayerController.setVolume(
//             this.videoPlayerController.volume + 0.05,
//           );
//           break;
//         case 'ArrowDown':
//           this.videoPlayerController.setVolume(
//             this.videoPlayerController.volume - 0.05,
//           );
//           break;
//       }
//     }
//   };
// }
