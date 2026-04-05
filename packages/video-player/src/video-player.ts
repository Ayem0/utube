import Hls from "hls.js";
import { EventEmitter } from "./event-emitter";

interface VideoPlayerEvents {
  qualitiesLoaded: [qualities: Array<{ height: number; frameRate: number }>];
}

export class VideoPlayer extends EventEmitter<VideoPlayerEvents> {
  private videoElement: HTMLVideoElement;
  private hls: Hls | null = null;

  constructor(videoElement: HTMLVideoElement, hlsUrl: string, dashUrl: string) {
    super();
    this.videoElement = videoElement;

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(hlsUrl);
      this.hls.attachMedia(this.videoElement);
      this.initHlsListeners();
    } else if (this.videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      this.videoElement.src = hlsUrl;
    } else {
      console.error("Currently only HLS is supported.");
    }
  }

  private initHlsListeners() {
    this.hls.on(Hls.Events.ERROR, (e, data) => {
      console.error("HLS Error:", data);
    });

    this.hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
      const qualities = data.levels.map((level) => ({
        height: level.height,
        frameRate: level.frameRate,
      }));
      this.emit("qualitiesLoaded", qualities);
    });

    this.hls.on(Hls.Events.LEVEL_LOADED, (e, data) => {
      console.log("Level Loaded:", data);
    });

    this.hls.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
      console.log("Level Switched:", data);
    });
  }

  public play() {
    return this.videoElement.play();
  }

  public pause() {
    return this.videoElement.pause();
  }

  public setQuality(quality: number) {
    this.hls.currentLevel = quality;
  }
}
